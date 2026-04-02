package com.example.system.service.user;

import com.example.system.domain.model.Post;
import com.example.system.domain.model.User;
import com.example.system.domain.model.UserStatus;
import com.example.system.repository.PostRepository;
import com.example.system.repository.UserRepository;
import com.example.system.repository.NotificationRepository;
import com.example.system.domain.model.notification.Notification;
import com.example.system.domain.model.notification.NotificationType;
import com.example.system.domain.model.notification.NotificationStatus;
import com.example.system.domain.model.Group;
import com.example.system.domain.model.GroupPrivacy;
import com.example.system.repository.GroupRepository;
import com.example.system.rest.dto.mapper.UserMapper;
import com.example.system.rest.dto.user.UserWriteDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PostRepository postRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final GroupRepository groupRepository;

    @Override
    @Transactional(readOnly = true)
    public User getUserById(String userId) {
        return userRepository.findById(userId).orElseThrow(
                () -> new RuntimeException("User with id=" + userId + " not found.")
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    @Transactional
    public User update(String id, UserWriteDto dto) {
        //retrieving existingUser to use its id in order to have a consistent id from db for the updated user
        User existingUser = getUserById(id);
        userMapper.updateEntityFromDto(dto, existingUser);
        return userRepository.save(existingUser);
    }

    @Override
    @Transactional(readOnly = true)
    public User getByUsername(String username) {
        return userRepository.findByUsername(username)//TODO create ResourceNotFoundException
                .orElseThrow(() -> new RuntimeException("User with username=" + username + " not found."));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    @Transactional
    public void deleteUser(String userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
    }

    @Override
    @Transactional
    public User updateStatus(String userId, UserStatus status) {
        User user = getUserById(userId);
        user.setStatus(status);
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User toggleProfilePrivacy(String userId) {
        User user = getUserById(userId);
        user.setProfilePrivate(!user.isProfilePrivate());
        return userRepository.save(user);
    }

    @Override
    public Long getUsersCount() {
        return userRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findLatestUsers(int limit) {
        return userRepository
                .findLatestUsers(PageRequest.of(0, limit))
                .getContent();
    }

    @Override
    @Transactional
    public User addBookmark(String userId, Long postId) {
        User user = getUserById(userId);
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        user.getBookmarks().add(post);
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User removeBookmark(String userId, Long postId) {
        User user = getUserById(userId);
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        user.getBookmarks().remove(post);
        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getBookmarkedPosts(String userId) {
        User user = getUserById(userId);
        return new ArrayList<>(user.getBookmarks());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isBookmarked(String userId, Long postId) {
        User user = getUserById(userId);
        return user.getBookmarks().stream().anyMatch(post -> post.getId().equals(postId));
    }

    @Override
    public List<User> search(String query, String userId) {
        return userRepository.findTop10ByUsernameStartingWithIgnoreCaseAndIdNotOrderByUsernameAsc(query, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getLikedPostsByUserId(String userId) {
        User user = getUserById(userId);
        return new ArrayList<>(user.getLikedPosts());

    }

    @Override
    @Transactional
    public void sendFriendRequest(String senderId, String recipientId) {
        User sender = getUserById(senderId);
        User recipient = getUserById(recipientId);
        if (senderId.equals(recipientId)) return;
        if (sender.getFriends().contains(recipient)) return;

        Notification notification = Notification.builder()
                .type(NotificationType.FRIEND_REQUEST)
                .status(NotificationStatus.UNREAD)
                .sender(sender)
                .recipient(recipient)
                .referenceId(senderId)
                .build();
        Notification saved = notificationRepository.save(notification);
        try {
            messagingTemplate.convertAndSendToUser(recipient.getId(), "/queue/notifications", saved);
        } catch (Exception ignored) {}
    }

    @Override
    @Transactional
    public void acceptFriendRequest(String recipientId, String senderId, Long notificationId) {
        User sender = getUserById(senderId);
        User recipient = getUserById(recipientId);

        recipient.getFriends().add(sender);
        sender.getFriends().add(recipient);
        userRepository.save(recipient);
        userRepository.save(sender);

        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null) {
            notificationRepository.delete(notification);
        }

        Notification acceptanceNotifier = Notification.builder()
                .type(NotificationType.FRIEND_ACCEPTED)
                .status(NotificationStatus.UNREAD)
                .sender(recipient)
                .recipient(sender)
                .referenceId(recipientId)
                .build();
        Notification saved = notificationRepository.save(acceptanceNotifier);
        try {
            messagingTemplate.convertAndSendToUser(sender.getId(), "/queue/notifications", saved);
        } catch (Exception ignored) {}
    }

    @Override
    @Transactional
    public void declineFriendRequest(String recipientId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null && notification.getRecipient().getId().equals(recipientId)) {
            notificationRepository.delete(notification);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getUserFriends(String userId) {
        User user = getUserById(userId);
        return new ArrayList<>(user.getFriends());
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getFriendRequests(String userId) {
        User user = getUserById(userId);
        List<Notification> notifications = notificationRepository.findByRecipientAndStatus(user, NotificationStatus.UNREAD);
        List<User> senders = new ArrayList<>();
        for (Notification notification : notifications) {
            if (notification.getType() == NotificationType.FRIEND_REQUEST) {
                senders.add(notification.getSender());
            }
        }
        return senders;
    }

    @Override
    @Transactional(readOnly = true)
    public String getFriendshipStatus(String myId, String otherUserId) {
        if (myId.equals(otherUserId)) return "NONE";
        User me = getUserById(myId);
        User other = getUserById(otherUserId);

        if (me.getFriends().contains(other)) {
            return "FRIENDS";
        }

        if (!notificationRepository.findBySenderAndRecipientAndType(me, other, NotificationType.FRIEND_REQUEST).isEmpty()) {
            return "PENDING_OUTGOING";
        }

        if (!notificationRepository.findBySenderAndRecipientAndType(other, me, NotificationType.FRIEND_REQUEST).isEmpty()) {
            return "PENDING_INCOMING";
        }

        return "NONE";
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getOutgoingFriendRequests(String userId) {
        User user = getUserById(userId);
        List<Notification> notifications = notificationRepository.findBySenderAndType(user, NotificationType.FRIEND_REQUEST);
        List<User> recipients = new ArrayList<>();
        for (Notification notification : notifications) {
            recipients.add(notification.getRecipient());
        }
        return recipients;
    }

    @Override
    @Transactional
    public void removeFriend(String myId, String friendId) {
        User me = getUserById(myId);
        User friend = getUserById(friendId);
        me.getFriends().remove(friend);
        friend.getFriends().remove(me);
        userRepository.save(me);
        userRepository.save(friend);

        // Also clean up any lingering request or accepted notifications between them
        List<Notification> outgoing = notificationRepository.findBySenderAndRecipientAndType(me, friend, NotificationType.FRIEND_REQUEST);
        List<Notification> incoming = notificationRepository.findBySenderAndRecipientAndType(friend, me, NotificationType.FRIEND_REQUEST);
        List<Notification> outAccepted = notificationRepository.findBySenderAndRecipientAndType(me, friend, NotificationType.FRIEND_ACCEPTED);
        List<Notification> inAccepted = notificationRepository.findBySenderAndRecipientAndType(friend, me, NotificationType.FRIEND_ACCEPTED);

        notificationRepository.deleteAll(outgoing);
        notificationRepository.deleteAll(incoming);
        notificationRepository.deleteAll(outAccepted);
        notificationRepository.deleteAll(inAccepted);
    }

    @Override
    @Transactional
    public Long getOrCreateUserWallGroup(String userId) {
        User user = getUserById(userId);
        String wallGroupName = user.getUsername() + "_wall";

        Optional<Group> existingWall = groupRepository.findByOwnerId(userId).stream()
                .filter(g -> GroupPrivacy.WALL.equals(g.getPrivacy()))
                .findFirst();

        if (existingWall.isPresent()) {
            return existingWall.get().getId();
        }

        Group wallGroup = Group.builder()
                .name(wallGroupName)
                .description("Wall for user " + user.getUsername())
                .privacy(GroupPrivacy.WALL)
                .owner(user)
                .build();

        wallGroup.getMembers().add(user);
        wallGroup = groupRepository.save(wallGroup);

        return wallGroup.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getUsersByGroupId(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id=" + groupId));
        return new java.util.ArrayList<>(group.getMembers());
    }
}

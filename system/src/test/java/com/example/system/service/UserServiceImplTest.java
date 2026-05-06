package com.example.system.service;

import com.example.system.domain.model.User;
import com.example.system.repository.UserRepository;
import com.example.system.repository.PostRepository;
import com.example.system.rest.dto.mapper.UserMapper;
import com.example.system.rest.dto.user.UserWriteDto;
import com.example.system.service.user.UserServiceImpl;
import com.example.system.utils.UserUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.BDDMockito;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.List;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.verify;

import com.example.system.domain.model.Group;
import com.example.system.domain.model.GroupPrivacy;
import com.example.system.domain.model.Post;
import com.example.system.domain.model.UserStatus;
import com.example.system.domain.model.notification.Notification;
import com.example.system.domain.model.notification.NotificationStatus;
import com.example.system.domain.model.notification.NotificationType;
import com.example.system.repository.GroupRepository;
import com.example.system.repository.NotificationRepository;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Set;

@ExtendWith(MockitoExtension.class)
public class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private PostRepository postRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private GroupRepository groupRepository;

    @InjectMocks
    private UserServiceImpl serviceUnderTest;

    @Test
    @DisplayName("Test get user by id functionality")
    public void givenUserId_whenGetUserById_thenReturnUser() {
        User user = UserUtils.getJohnDoe();
        BDDMockito.given(userRepository.findById(user.getId())).willReturn(Optional.of(user));

        User result = serviceUnderTest.getUserById(user.getId());

        assertEquals(user.getId(), result.getId());
    }

    @Test
    @DisplayName("Test update user functionality")
    public void givenUserToUpdate_whenUpdateUser_thenRepositoryIsCalled() {
        //given
        User existingUser = UserUtils.getJaneDoe();
        UserWriteDto dto = new UserWriteDto(existingUser.getUsername(), existingUser.getEmail(), existingUser.getFirstName(), existingUser.getLastName(), existingUser.getBio(), existingUser.getStatus(), existingUser.isProfilePrivate());

        BDDMockito.given(userRepository.findById(existingUser.getId())).willReturn(Optional.of(existingUser));
        BDDMockito.given(userRepository.save(any(User.class))).willReturn(existingUser);

        //when
        User savedUser = serviceUnderTest.update(existingUser.getId(), dto);

        //then
        verify(userMapper).updateEntityFromDto(dto, existingUser);
        verify(userRepository).save(existingUser);
        assertEquals(existingUser.getId(), savedUser.getId());
    }

    @Test
    @DisplayName("Test find by username functionality")
    public void givenUsername_whenGetByUsername_thenReturnUser() {
        User user = UserUtils.getAdminUser();
        BDDMockito.given(userRepository.findByUsername(user.getUsername())).willReturn(Optional.of(user));

        User result = serviceUnderTest.getByUsername(user.getUsername());

        assertEquals(user.getUsername(), result.getUsername());
    }

    @Test
    @DisplayName("Test delete user functionality")
    public void givenUserId_whenDeleteUser_thenRepositoryDeleteIsCalled() {
        User user = UserUtils.getJohnDoe();
        BDDMockito.given(userRepository.findById(user.getId())).willReturn(Optional.of(user));

        serviceUnderTest.deleteUser(user.getId());

        verify(userRepository).delete(user);
    }

    @Test
    @DisplayName("Test get all users functionality")
    public void givenUsers_whenFindAll_thenReturnList() {
        List<User> users = List.of(UserUtils.getJohnDoe(), UserUtils.getJaneDoe());
        given(userRepository.findAll()).willReturn(users);

        List<User> result = serviceUnderTest.findAll();

        assertEquals(2, result.size());
        then(userRepository).should().findAll();
    }

    @Test
    @DisplayName("Test checking if user exists by username")
    public void givenUsername_whenExistsByUsername_thenReturnBoolean() {
        String username = "testuser";
        given(userRepository.existsByUsername(username)).willReturn(true);

        boolean result = serviceUnderTest.existsByUsername(username);

        assertTrue(result);
    }

    @Test
    @DisplayName("Test update user status")
    public void givenUserIdAndStatus_whenUpdateStatus_thenStatusIsUpdated() {
        User user = UserUtils.getJohnDoe();
        user.setStatus(UserStatus.OFFLINE);
        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));
        given(userRepository.save(user)).willReturn(user);

        User result = serviceUnderTest.updateStatus(user.getId(), UserStatus.ONLINE);

        assertEquals(UserStatus.ONLINE, result.getStatus());
        then(userRepository).should().save(user);
    }

    @Test
    @DisplayName("Test toggle profile privacy")
    public void givenUserId_whenToggleProfilePrivacy_thenPrivacyIsToggled() {
        User user = UserUtils.getJohnDoe();
        user.setProfilePrivate(false);
        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));
        given(userRepository.save(user)).willReturn(user);

        User result = serviceUnderTest.toggleProfilePrivacy(user.getId());

        assertTrue(result.isProfilePrivate());
        then(userRepository).should().save(user);
    }

    @Test
    @DisplayName("Test add bookmark")
    public void givenUserIdAndPostId_whenAddBookmark_thenPostIsAddedToBookmarks() {
        User user = UserUtils.getJohnDoe();
        user.setBookmarks(new HashSet<>());
        Post post = new Post();
        post.setId(1L);

        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));
        given(postRepository.findById(1L)).willReturn(Optional.of(post));
        given(userRepository.save(user)).willReturn(user);

        User result = serviceUnderTest.addBookmark(user.getId(), 1L);

        assertTrue(result.getBookmarks().contains(post));
        then(userRepository).should().save(user);
    }

    // ── getUserById ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test get user by id not found")
    public void givenInvalidUserId_whenGetUserById_thenThrowException() {
        // Given
        given(userRepository.findById("missing")).willReturn(Optional.empty());

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> serviceUnderTest.getUserById("missing"));
        assertEquals("User with id=missing not found.", ex.getMessage());
    }

    // ── getByUsername ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test get by username not found")
    public void givenInvalidUsername_whenGetByUsername_thenThrowException() {
        // Given
        given(userRepository.findByUsername("ghost")).willReturn(Optional.empty());

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> serviceUnderTest.getByUsername("ghost"));
        assertEquals("User with username=ghost not found.", ex.getMessage());
    }

    // ── getUsersCount ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test get users count")
    public void givenUsers_whenGetUsersCount_thenReturnCount() {
        // Given
        given(userRepository.count()).willReturn(42L);

        // When
        Long result = serviceUnderTest.getUsersCount();

        // Then
        assertEquals(42L, result);
    }

    // ── findLatestUsers ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test find latest users")
    public void givenLimit_whenFindLatestUsers_thenReturnPageContent() {
        // Given
        List<User> users = List.of(UserUtils.getJohnDoe(), UserUtils.getJaneDoe());
        given(userRepository.findLatestUsers(PageRequest.of(0, 2)))
                .willReturn(new PageImpl<>(users));

        // When
        List<User> result = serviceUnderTest.findLatestUsers(2);

        // Then
        assertEquals(2, result.size());
    }

    // ── removeBookmark ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test remove bookmark")
    public void givenUserIdAndPostId_whenRemoveBookmark_thenPostIsRemovedFromBookmarks() {
        // Given
        User user = UserUtils.getJohnDoe();
        Post post = new Post();
        post.setId(2L);
        user.setBookmarks(new HashSet<>(Set.of(post)));

        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));
        given(postRepository.findById(2L)).willReturn(Optional.of(post));
        given(userRepository.save(user)).willReturn(user);

        // When
        User result = serviceUnderTest.removeBookmark(user.getId(), 2L);

        // Then
        assertFalse(result.getBookmarks().contains(post));
        then(userRepository).should().save(user);
    }

    // ── getBookmarkedPosts ────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test get bookmarked posts")
    public void givenUserWithBookmarks_whenGetBookmarkedPosts_thenReturnList() {
        // Given
        User user = UserUtils.getJohnDoe();
        Post p1 = new Post(); p1.setId(1L);
        Post p2 = new Post(); p2.setId(2L);
        user.setBookmarks(new HashSet<>(Set.of(p1, p2)));

        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));

        // When
        List<Post> result = serviceUnderTest.getBookmarkedPosts(user.getId());

        // Then
        assertEquals(2, result.size());
    }

    // ── isBookmarked ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test is bookmarked returns true")
    public void givenBookmarkedPost_whenIsBookmarked_thenReturnTrue() {
        // Given
        User user = UserUtils.getJohnDoe();
        Post post = new Post(); post.setId(5L);
        user.setBookmarks(new HashSet<>(Set.of(post)));

        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));

        // When & Then
        assertTrue(serviceUnderTest.isBookmarked(user.getId(), 5L));
    }

    @Test
    @DisplayName("Test is bookmarked returns false")
    public void givenNonBookmarkedPost_whenIsBookmarked_thenReturnFalse() {
        // Given
        User user = UserUtils.getJohnDoe();
        user.setBookmarks(new HashSet<>());

        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));

        // When & Then
        assertFalse(serviceUnderTest.isBookmarked(user.getId(), 99L));
    }

    // ── search ────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test search users by query")
    public void givenQuery_whenSearch_thenReturnMatchingUsers() {
        // Given
        String query = "john";
        String userId = "me";
        given(userRepository.findTop10ByUsernameStartingWithIgnoreCaseAndIdNotOrderByUsernameAsc(query, userId))
                .willReturn(List.of(UserUtils.getJohnDoe()));

        // When
        List<User> result = serviceUnderTest.search(query, userId);

        // Then
        assertEquals(1, result.size());
    }

    // ── getLikedPostsByUserId ─────────────────────────────────────────────────────

    @Test
    @DisplayName("Test get liked posts by user id")
    public void givenUserWithLikedPosts_whenGetLikedPostsByUserId_thenReturnList() {
        // Given
        User user = UserUtils.getJohnDoe();
        Post p = new Post(); p.setId(3L);
        user.setLikedPosts(new HashSet<>(Set.of(p)));

        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));

        // When
        List<Post> result = serviceUnderTest.getLikedPostsByUserId(user.getId());

        // Then
        assertEquals(1, result.size());
    }

    // ── sendFriendRequest ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test send friend request saves notification")
    public void givenTwoDifferentUsers_whenSendFriendRequest_thenNotificationIsSaved() {
        // Given
        User sender = UserUtils.getJohnDoe();
        User recipient = UserUtils.getJaneDoe();
        sender.setFriends(new HashSet<>());

        given(userRepository.findById(sender.getId())).willReturn(Optional.of(sender));
        given(userRepository.findById(recipient.getId())).willReturn(Optional.of(recipient));
        given(notificationRepository.save(any(Notification.class)))
                .willReturn(Notification.builder().id(1L).build());

        // When
        serviceUnderTest.sendFriendRequest(sender.getId(), recipient.getId());

        // Then
        then(notificationRepository).should().save(any(Notification.class));
    }

    @Test
    @DisplayName("Test send friend request to self is ignored")
    public void givenSameUserId_whenSendFriendRequest_thenNoNotificationSaved() {
        // Given
        User user = UserUtils.getJohnDoe();
        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));

        // When
        serviceUnderTest.sendFriendRequest(user.getId(), user.getId());

        // Then
        then(notificationRepository).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("Test send friend request when already friends is ignored")
    public void givenAlreadyFriends_whenSendFriendRequest_thenNoNotificationSaved() {
        // Given
        User sender = UserUtils.getJohnDoe();
        User recipient = UserUtils.getJaneDoe();
        sender.setFriends(new HashSet<>(Set.of(recipient)));

        given(userRepository.findById(sender.getId())).willReturn(Optional.of(sender));
        given(userRepository.findById(recipient.getId())).willReturn(Optional.of(recipient));

        // When
        serviceUnderTest.sendFriendRequest(sender.getId(), recipient.getId());

        // Then
        then(notificationRepository).shouldHaveNoInteractions();
    }

    // ── acceptFriendRequest ───────────────────────────────────────────────────────

    @Test
    @DisplayName("Test accept friend request adds both users as friends")
    public void givenFriendRequest_whenAcceptFriendRequest_thenBothUsersAreFriends() {
        // Given
        User sender = UserUtils.getJohnDoe();
        User recipient = UserUtils.getJaneDoe();
        sender.setFriends(new HashSet<>());
        recipient.setFriends(new HashSet<>());

        Notification request = Notification.builder().id(10L).build();
        given(userRepository.findById(sender.getId())).willReturn(Optional.of(sender));
        given(userRepository.findById(recipient.getId())).willReturn(Optional.of(recipient));
        given(notificationRepository.findById(10L)).willReturn(Optional.of(request));
        given(notificationRepository.save(any(Notification.class)))
                .willReturn(Notification.builder().id(11L).build());

        // When
        serviceUnderTest.acceptFriendRequest(recipient.getId(), sender.getId(), 10L);

        // Then
        assertTrue(recipient.getFriends().contains(sender));
        assertTrue(sender.getFriends().contains(recipient));
        then(notificationRepository).should().delete(request);
    }

    // ── declineFriendRequest ──────────────────────────────────────────────────────

    @Test
    @DisplayName("Test decline friend request deletes notification")
    public void givenFriendRequest_whenDeclineFriendRequest_thenNotificationIsDeleted() {
        // Given
        User recipient = new User(); recipient.setId("rec1");
        Notification notification = Notification.builder().id(5L).recipient(recipient).build();
        given(notificationRepository.findById(5L)).willReturn(Optional.of(notification));

        // When
        serviceUnderTest.declineFriendRequest("rec1", 5L);

        // Then
        then(notificationRepository).should().delete(notification);
    }

    @Test
    @DisplayName("Test decline friend request for wrong recipient is ignored")
    public void givenWrongRecipient_whenDeclineFriendRequest_thenNoDelete() {
        // Given
        User actualRecipient = new User(); actualRecipient.setId("real-recipient");
        Notification notification = Notification.builder().id(5L).recipient(actualRecipient).build();
        given(notificationRepository.findById(5L)).willReturn(Optional.of(notification));

        // When
        serviceUnderTest.declineFriendRequest("someone-else", 5L);

        // Then
        then(notificationRepository).should(Mockito.never()).delete(any());
    }

    // ── getUserFriends ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test get user friends")
    public void givenUserWithFriends_whenGetUserFriends_thenReturnFriendsList() {
        // Given
        User user = UserUtils.getJohnDoe();
        User friend = UserUtils.getJaneDoe();
        user.setFriends(new HashSet<>(Set.of(friend)));

        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));

        // When
        List<User> result = serviceUnderTest.getUserFriends(user.getId());

        // Then
        assertEquals(1, result.size());
        assertTrue(result.contains(friend));
    }

    // ── getFriendRequests ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test get friend requests returns senders")
    public void givenPendingFriendRequest_whenGetFriendRequests_thenReturnSenders() {
        // Given
        User user = UserUtils.getJohnDoe();
        User requester = UserUtils.getJaneDoe();

        Notification notification = Notification.builder()
                .type(NotificationType.FRIEND_REQUEST)
                .sender(requester)
                .build();

        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));
        given(notificationRepository.findByRecipientAndStatus(user, NotificationStatus.UNREAD))
                .willReturn(List.of(notification));

        // When
        List<User> result = serviceUnderTest.getFriendRequests(user.getId());

        // Then
        assertEquals(1, result.size());
        assertEquals(requester, result.get(0));
    }

    // ── getFriendshipStatus ───────────────────────────────────────────────────────

    @Test
    @DisplayName("Test friendship status returns NONE when same user")
    public void givenSameUser_whenGetFriendshipStatus_thenReturnNone() {
        // When & Then
        assertEquals("NONE", serviceUnderTest.getFriendshipStatus("u1", "u1"));
    }

    @Test
    @DisplayName("Test friendship status returns FRIENDS")
    public void givenFriends_whenGetFriendshipStatus_thenReturnFriends() {
        // Given
        User me = UserUtils.getJohnDoe();
        User other = UserUtils.getJaneDoe();
        me.setFriends(new HashSet<>(Set.of(other)));

        given(userRepository.findById(me.getId())).willReturn(Optional.of(me));
        given(userRepository.findById(other.getId())).willReturn(Optional.of(other));

        // When & Then
        assertEquals("FRIENDS", serviceUnderTest.getFriendshipStatus(me.getId(), other.getId()));
    }

    @Test
    @DisplayName("Test friendship status returns PENDING_OUTGOING")
    public void givenOutgoingRequest_whenGetFriendshipStatus_thenReturnPendingOutgoing() {
        // Given
        User me = UserUtils.getJohnDoe();
        User other = UserUtils.getJaneDoe();
        me.setFriends(new HashSet<>());

        given(userRepository.findById(me.getId())).willReturn(Optional.of(me));
        given(userRepository.findById(other.getId())).willReturn(Optional.of(other));
        given(notificationRepository.findBySenderAndRecipientAndType(me, other, NotificationType.FRIEND_REQUEST))
                .willReturn(List.of(Notification.builder().build()));

        // When & Then
        assertEquals("PENDING_OUTGOING", serviceUnderTest.getFriendshipStatus(me.getId(), other.getId()));
    }

    @Test
    @DisplayName("Test friendship status returns PENDING_INCOMING")
    public void givenIncomingRequest_whenGetFriendshipStatus_thenReturnPendingIncoming() {
        // Given
        User me = UserUtils.getJohnDoe();
        User other = UserUtils.getJaneDoe();
        me.setFriends(new HashSet<>());

        given(userRepository.findById(me.getId())).willReturn(Optional.of(me));
        given(userRepository.findById(other.getId())).willReturn(Optional.of(other));
        given(notificationRepository.findBySenderAndRecipientAndType(me, other, NotificationType.FRIEND_REQUEST))
                .willReturn(List.of());
        given(notificationRepository.findBySenderAndRecipientAndType(other, me, NotificationType.FRIEND_REQUEST))
                .willReturn(List.of(Notification.builder().build()));

        // When & Then
        assertEquals("PENDING_INCOMING", serviceUnderTest.getFriendshipStatus(me.getId(), other.getId()));
    }

    @Test
    @DisplayName("Test friendship status returns NONE when no relation")
    public void givenNoRelation_whenGetFriendshipStatus_thenReturnNone() {
        // Given
        User me = UserUtils.getJohnDoe();
        User other = UserUtils.getJaneDoe();
        me.setFriends(new HashSet<>());

        given(userRepository.findById(me.getId())).willReturn(Optional.of(me));
        given(userRepository.findById(other.getId())).willReturn(Optional.of(other));
        given(notificationRepository.findBySenderAndRecipientAndType(me, other, NotificationType.FRIEND_REQUEST))
                .willReturn(List.of());
        given(notificationRepository.findBySenderAndRecipientAndType(other, me, NotificationType.FRIEND_REQUEST))
                .willReturn(List.of());

        // When & Then
        assertEquals("NONE", serviceUnderTest.getFriendshipStatus(me.getId(), other.getId()));
    }

    // ── getOutgoingFriendRequests ─────────────────────────────────────────────────

    @Test
    @DisplayName("Test get outgoing friend requests returns recipients")
    public void givenOutgoingRequests_whenGetOutgoingFriendRequests_thenReturnRecipients() {
        // Given
        User sender = UserUtils.getJohnDoe();
        User recipient = UserUtils.getJaneDoe();

        Notification notification = Notification.builder()
                .type(NotificationType.FRIEND_REQUEST)
                .recipient(recipient)
                .build();

        given(userRepository.findById(sender.getId())).willReturn(Optional.of(sender));
        given(notificationRepository.findBySenderAndType(sender, NotificationType.FRIEND_REQUEST))
                .willReturn(List.of(notification));

        // When
        List<User> result = serviceUnderTest.getOutgoingFriendRequests(sender.getId());

        // Then
        assertEquals(1, result.size());
        assertEquals(recipient, result.get(0));
    }

    // ── removeFriend ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test remove friend removes both users from each other's friends list")
    public void givenFriends_whenRemoveFriend_thenBothRemovedFromEachOtherFriends() {
        // Given
        User me = UserUtils.getJohnDoe();
        User friend = UserUtils.getJaneDoe();
        me.setFriends(new HashSet<>(Set.of(friend)));
        friend.setFriends(new HashSet<>(Set.of(me)));

        given(userRepository.findById(me.getId())).willReturn(Optional.of(me));
        given(userRepository.findById(friend.getId())).willReturn(Optional.of(friend));
        given(notificationRepository.findBySenderAndRecipientAndType(any(), any(), any()))
                .willReturn(List.of());

        // When
        serviceUnderTest.removeFriend(me.getId(), friend.getId());

        // Then
        assertFalse(me.getFriends().contains(friend));
        assertFalse(friend.getFriends().contains(me));
        then(userRepository).should().save(me);
        then(userRepository).should().save(friend);
    }

    // ── getOrCreateUserWallGroup ──────────────────────────────────────────────────

    @Test
    @DisplayName("Test returns existing wall group id without creating a new one")
    public void givenExistingWallGroup_whenGetOrCreateUserWallGroup_thenReturnExistingId() {
        // Given
        User user = UserUtils.getJohnDoe();
        Group wallGroup = Group.builder().id(7L).privacy(GroupPrivacy.WALL).owner(user).build();

        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));
        given(groupRepository.findByOwnerId(user.getId())).willReturn(List.of(wallGroup));

        // When
        Long result = serviceUnderTest.getOrCreateUserWallGroup(user.getId());

        // Then
        assertEquals(7L, result);
        then(groupRepository).should(Mockito.never()).save(any());
    }

    @Test
    @DisplayName("Test creates new wall group when none exists")
    public void givenNoWallGroup_whenGetOrCreateUserWallGroup_thenCreateAndReturnId() {
        // Given
        User user = UserUtils.getJohnDoe();
        Group saved = Group.builder().id(99L).privacy(GroupPrivacy.WALL).build();

        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));
        given(groupRepository.findByOwnerId(user.getId())).willReturn(List.of());
        given(groupRepository.save(any(Group.class))).willReturn(saved);

        // When
        Long result = serviceUnderTest.getOrCreateUserWallGroup(user.getId());

        // Then
        assertEquals(99L, result);
        then(groupRepository).should().save(any(Group.class));
    }

    // ── getUsersByGroupId ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test get users by group id returns members")
    public void givenGroupId_whenGetUsersByGroupId_thenReturnMembers() {
        // Given
        User member = UserUtils.getJohnDoe();
        Group group = Group.builder().id(1L).members(new HashSet<>(Set.of(member))).build();

        given(groupRepository.findById(1L)).willReturn(Optional.of(group));

        // When
        List<User> result = serviceUnderTest.getUsersByGroupId(1L);

        // Then
        assertEquals(1, result.size());
        assertTrue(result.contains(member));
    }

    @Test
    @DisplayName("Test get users by invalid group id throws exception")
    public void givenInvalidGroupId_whenGetUsersByGroupId_thenThrowException() {
        // Given
        given(groupRepository.findById(99L)).willReturn(Optional.empty());

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> serviceUnderTest.getUsersByGroupId(99L));
        assertEquals("Group not found with id=99", ex.getMessage());
    }
}
package com.example.system.service.user;

import com.example.system.domain.model.Post;
import com.example.system.domain.model.User;
import com.example.system.domain.model.UserStatus;
import com.example.system.repository.PostRepository;
import com.example.system.repository.UserRepository;
import com.example.system.rest.dto.mapper.UserMapper;
import com.example.system.rest.dto.user.UserWriteDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PostRepository postRepository;

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
}

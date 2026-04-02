package com.example.system.service;


import com.example.system.domain.model.Post;
import com.example.system.domain.model.User;
import com.example.system.repository.PostRepository;
import com.example.system.repository.UserRepository;
import com.example.system.service.notification.NotificationService;
import com.example.system.service.post.PostServiceImpl;
import com.example.system.service.user.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.*;

import com.example.system.domain.model.notification.NotificationType;

@ExtendWith(MockitoExtension.class)
public class PostServiceImplTest {

    @Mock
    private PostRepository postRepository;
    @Mock
    private UserService userService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private PostServiceImpl postService;

    @Test
    @DisplayName("Test getting post by id")
    public void givenPostId_whenGetPostById_thenReturnPost() {
        // Given
        Long postId = 1L;
        Post post = new Post();
        post.setId(postId);
        post.setText("Test post");

        given(postRepository.findById(postId)).willReturn(Optional.of(post));

        // When
        Post result = postService.getPostById(postId);

        // Then
        assertNotNull(result);
        assertEquals(postId, result.getId());
        assertEquals("Test post", result.getText());
    }

    @Test
    @DisplayName("Test create post")
    public void givenPostDataAndOwner_whenCreatePost_thenSetDefaultsAndSave() {
        // Given
        String ownerId = "user1";
        User owner = new User();
        owner.setId(ownerId);

        Post post = new Post();
        post.setText("New Post");

        given(userService.getUserById(ownerId)).willReturn(owner);
        given(postRepository.save(post)).willReturn(post);

        // When
        Post result = postService.createPost(post, ownerId);

        // Then
        assertNotNull(result);
        assertEquals(0L, result.getViews());
        assertEquals(0L, result.getLikes());
        assertEquals(owner, result.getAuthor());
        then(postRepository).should().save(post);
    }

    @Test
    @DisplayName("Test get all posts")
    public void givenPosts_whenGetAllPosts_thenReturnList() {
        // Given
        List<Post> posts = List.of(new Post(), new Post());
        given(postRepository.findAll()).willReturn(posts);

        // When
        List<Post> result = postService.getAllPosts();

        // Then
        assertEquals(2, result.size());
        then(postRepository).should().findAll();
    }

    @Test
    @DisplayName("Test update post")
    public void givenUpdateData_whenUpdatePost_thenReturnUpdatedPost() {
        // Given
        Long postId = 1L;
        Post existing = new Post();
        existing.setId(postId);
        existing.setText("Old text");

        Post updateData = new Post();
        updateData.setText("New text");

        given(postRepository.findById(postId)).willReturn(Optional.of(existing));
        given(postRepository.save(existing)).willReturn(existing);

        // When
        Post result = postService.updatePost(postId, updateData);

        // Then
        assertEquals("New text", result.getText());
        then(postRepository).should().save(existing);
    }

    @Test
    @DisplayName("Test delete post")
    public void givenPostId_whenDeletePost_thenRepositoryDeleteIsCalled() {
        // Given
        Long postId = 1L;
        Post post = new Post();
        post.setId(postId);

        given(postRepository.findById(postId)).willReturn(Optional.of(post));

        // When
        postService.deletePost(postId);

        // Then
        then(postRepository).should().delete(post);
    }

    @Test
    @DisplayName("Test get posts by author id")
    public void givenAuthorId_whenGetPostsByAuthorId_thenReturnList() {
        // Given
        String authorId = "user1";
        given(postRepository.findByAuthorIdOrderByCreatedAtDesc(authorId)).willReturn(List.of(new Post()));

        // When
        List<Post> result = postService.getPostsByAuthorId(authorId);

        // Then
        assertEquals(1, result.size());
        then(postRepository).should().findByAuthorIdOrderByCreatedAtDesc(authorId);
    }

    @Test
    @DisplayName("Test get posts by group id")
    public void givenGroupId_whenGetPostsByGroupId_thenReturnList() {
        // Given
        Long groupId = 1L;
        given(postRepository.findByGroupIdOrderByCreatedAtDesc(groupId)).willReturn(List.of(new Post()));

        // When
        List<Post> result = postService.getPostsByGroupId(groupId);

        // Then
        assertEquals(1, result.size());
        then(postRepository).should().findByGroupIdOrderByCreatedAtDesc(groupId);
    }

    @Test
    @DisplayName("Test increment views")
    public void givenPostId_whenIncrementViews_thenViewsIncreased() {
        // Given
        Long postId = 1L;
        Post post = new Post();
        post.setId(postId);
        post.setViews(5L);

        given(postRepository.findById(postId)).willReturn(Optional.of(post));
        given(postRepository.save(post)).willReturn(post);

        // When
        Post result = postService.incrementViews(postId);

        // Then
        assertEquals(6L, result.getViews());
        then(postRepository).should().save(post);
    }

    @Test
    @DisplayName("Test increment likes (new like)")
    public void givenPostIdAndUser_whenIncrementLikes_thenLikeAddedAndNotificationSent() {
        // Given
        Long postId = 1L;
        String userId = "user1";

        User author = new User();
        author.setId("author1");

        Post post = new Post();
        post.setId(postId);
        post.setLikes(0L);
        post.setAuthor(author);

        User user = new User();
        user.setId(userId);
        user.setLikedPosts(new HashSet<>());

        given(postRepository.findById(postId)).willReturn(Optional.of(post));
        given(userService.getUserById(userId)).willReturn(user);
        given(userRepository.save(user)).willReturn(user);
        given(postRepository.save(post)).willReturn(post);

        // When
        Post result = postService.incrementLikesAndAddToUser(postId, userId);

        // Then
        assertEquals(1L, result.getLikes());
        assertTrue(user.getLikedPosts().contains(post));
        then(notificationService).should().createNotification("author1", userId, NotificationType.LIKE_POST, "1");
        then(userRepository).should().save(user);
        then(postRepository).should().save(post);
    }

    @Test
    @DisplayName("Test decrement likes (unlike)")
    public void givenAlreadyLikedPostAndUser_whenIncrementLikes_thenLikeRemoved() {
        // Given
        Long postId = 1L;
        String userId = "user1";

        Post post = new Post();
        post.setId(postId);
        post.setLikes(1L);

        User user = new User();
        user.setId(userId);
        user.setLikedPosts(new HashSet<>(List.of(post)));

        given(postRepository.findById(postId)).willReturn(Optional.of(post));
        given(userService.getUserById(userId)).willReturn(user);
        given(userRepository.save(user)).willReturn(user);
        given(postRepository.save(post)).willReturn(post);

        // When
        Post result = postService.incrementLikesAndAddToUser(postId, userId);

        // Then
        assertEquals(0L, result.getLikes());
        assertFalse(user.getLikedPosts().contains(post));
        then(notificationService).shouldHaveNoInteractions();
        then(userRepository).should().save(user);
        then(postRepository).should().save(post);
    }
}

package com.example.system.service;

import com.example.system.domain.model.Comment;
import com.example.system.repository.CommentLikeRepository;
import com.example.system.repository.CommentRepository;
import com.example.system.repository.PostRepository;
import com.example.system.repository.UserRepository;
import com.example.system.service.comment.CommentServiceImpl;
import com.example.system.service.notification.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.*;

import com.example.system.domain.model.Post;
import com.example.system.domain.model.User;
import com.example.system.domain.model.CommentLike;
import com.example.system.domain.model.CommentLikeId;
import com.example.system.domain.model.notification.NotificationType;

@ExtendWith(MockitoExtension.class)
public class CommentServiceImplTest {

    @Mock private CommentRepository commentRepository;
    @Mock private PostRepository postRepository;
    @Mock private UserRepository userRepository;
    @Mock private CommentLikeRepository commentLikeRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private CommentServiceImpl commentService;

    @Test
    @DisplayName("Test getting comments by post ID")
    public void givenPostId_whenGetCommentsByPostId_thenReturnCommentsList() {
        // Given
        Comment comment = new Comment();
        comment.setId(5L);
        comment.setContent("Hello World");

        java.util.List<Comment> comments = java.util.List.of(comment);

        given(commentRepository.findByPostIdOrderByCreatedAtDesc(10L)).willReturn(comments);

        // When
        java.util.List<Comment> result = commentService.getCommentsByPostId(10L);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(5L, result.get(0).getId());
        assertEquals("Hello World", result.get(0).getContent());
    }

    @Test
    @DisplayName("Test adding a comment successfully")
    public void givenValidCommentData_whenAddComment_thenReturnSavedComment() {
        // Given
        Long postId = 1L;
        String authorId = "user1";
        Comment comment = new Comment();

        Post post = new Post();
        post.setId(postId);
        User postAuthor = new User();
        postAuthor.setId("user2");
        post.setAuthor(postAuthor);

        User author = new User();
        author.setId(authorId);

        given(postRepository.findById(postId)).willReturn(Optional.of(post));
        given(userRepository.findById(authorId)).willReturn(Optional.of(author));

        Comment savedComment = new Comment();
        savedComment.setId(10L);
        given(commentRepository.save(comment)).willReturn(savedComment);

        // When
        Comment result = commentService.addComment(postId, authorId, comment);

        // Then
        assertNotNull(result);
        assertEquals(post, comment.getPost());
        assertEquals(author, comment.getAuthor());
        then(notificationService).should().createNotification("user2", "user1", NotificationType.NEW_COMMENT, "10");
    }

    @Test
    @DisplayName("Test updating a comment successfully")
    public void givenValidUpdateData_whenUpdateComment_thenReturnUpdatedComment() {
        // Given
        Long commentId = 1L;
        String authorId = "user1";
        String newContent = "Updated content";

        Comment comment = new Comment();
        User author = new User();
        author.setId(authorId);
        comment.setAuthor(author);

        given(commentRepository.findById(commentId)).willReturn(Optional.of(comment));
        given(commentRepository.save(comment)).willReturn(comment);

        // When
        Comment result = commentService.updateComment(commentId, authorId, newContent);

        // Then
        assertEquals(newContent, result.getContent());
        assertTrue(result.getIsEdited());
    }

    @Test
    @DisplayName("Test updating a comment unauthorized")
    public void givenUnauthorizedUser_whenUpdateComment_thenThrowException() {
        // Given
        Long commentId = 1L;
        String authorId = "user1";

        Comment comment = new Comment();
        User author = new User();
        author.setId("user2");
        comment.setAuthor(author);

        given(commentRepository.findById(commentId)).willReturn(Optional.of(comment));

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                commentService.updateComment(commentId, authorId, "New Content"));

        assertEquals("User is not the author of this comment", ex.getMessage());
    }

    @Test
    @DisplayName("Test deleting a comment by comment author")
    public void givenCommentAuthor_whenDeleteComment_thenRepositoryDeleteIsCalled() {
        // Given
        Long commentId = 1L;
        String authorId = "user1";

        Comment comment = new Comment();
        User author = new User();
        author.setId(authorId);
        comment.setAuthor(author);

        given(commentRepository.findById(commentId)).willReturn(Optional.of(comment));

        // When
        commentService.deleteComment(commentId, authorId);

        // Then
        then(commentRepository).should().delete(comment);
    }

    @Test
    @DisplayName("Test deleting a comment by post author")
    public void givenPostAuthor_whenDeleteComment_thenRepositoryDeleteIsCalled() {
        // Given
        Long commentId = 1L;
        String authorId = "user1";

        Comment comment = new Comment();
        User commentAuthor = new User();
        commentAuthor.setId("user2");
        comment.setAuthor(commentAuthor);

        Post post = new Post();
        User postAuthor = new User();
        postAuthor.setId(authorId);
        post.setAuthor(postAuthor);
        comment.setPost(post);

        given(commentRepository.findById(commentId)).willReturn(Optional.of(comment));

        // When
        commentService.deleteComment(commentId, authorId);

        // Then
        then(commentRepository).should().delete(comment);
    }

    @Test
    @DisplayName("Test liking a comment")
    public void givenCommentIdAndUserId_whenLikeComment_thenLikesAreIncremented() {
        // Given
        Long commentId = 1L;
        String userId = "user1";

        Comment comment = new Comment();
        comment.setId(commentId);
        comment.setLikes(0L);

        User commentAuthor = new User();
        commentAuthor.setId("user2");
        comment.setAuthor(commentAuthor);

        User user = new User();
        user.setId(userId);

        CommentLikeId id = new CommentLikeId(commentId, userId);

        given(commentRepository.findById(commentId)).willReturn(Optional.of(comment));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(commentLikeRepository.findById(id)).willReturn(Optional.empty());
        given(commentRepository.save(comment)).willReturn(comment);

        // When
        Comment result = commentService.likeComment(commentId, userId);

        // Then
        assertEquals(1, comment.getLikes());
        then(commentLikeRepository).should().save(any(CommentLike.class));
        then(notificationService).should().createNotification("user2", "user1", NotificationType.LIKE_COMMENT, "1");
    }

    @Test
    @DisplayName("Test disliking a comment")
    public void givenCommentIdAndUserId_whenDislikeComment_thenDislikesAreIncremented() {
        // Given
        Long commentId = 1L;
        String userId = "user1";

        Comment comment = new Comment();
        comment.setId(commentId);
        comment.setDislikes(0L);

        User user = new User();
        user.setId(userId);

        CommentLikeId id = new CommentLikeId(commentId, userId);

        given(commentRepository.findById(commentId)).willReturn(Optional.of(comment));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(commentLikeRepository.findById(id)).willReturn(Optional.empty());
        given(commentRepository.save(comment)).willReturn(comment);

        // When
        Comment result = commentService.dislikeComment(commentId, userId);

        // Then
        assertEquals(1, comment.getDislikes());
        then(commentLikeRepository).should().save(any(CommentLike.class));
    }

    @Test
    @DisplayName("Test removing like or dislike")
    public void givenExistingLikeOrDislike_whenRemoveLikeOrDislike_thenCountIsDecremented() {
        // Given
        Long commentId = 1L;
        String userId = "user1";

        Comment comment = new Comment();
        comment.setId(commentId);
        comment.setLikes(1L);

        CommentLikeId id = new CommentLikeId(commentId, userId);
        CommentLike like = new CommentLike();
        like.setIsLike(true);

        given(commentRepository.findById(commentId)).willReturn(Optional.of(comment));
        given(commentLikeRepository.findById(id)).willReturn(Optional.of(like));
        given(commentRepository.save(comment)).willReturn(comment);

        // When
        Comment result = commentService.removeLikeOrDislike(commentId, userId);

        // Then
        assertEquals(0, comment.getLikes());
        then(commentLikeRepository).should().delete(like);
    }
}
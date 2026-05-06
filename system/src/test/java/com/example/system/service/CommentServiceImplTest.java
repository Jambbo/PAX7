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

    @Test
    @DisplayName("Test liking a comment that already has a dislike switches vote to like")
    public void givenExistingDislike_whenLikeComment_thenVoteIsSwitchedToLike() {
        // Given
        Long commentId = 1L;
        String userId = "user1";

        Comment comment = new Comment();
        comment.setId(commentId);
        comment.setLikes(0L);
        comment.setDislikes(1L);

        User user = new User(); user.setId(userId);
        CommentLikeId id = new CommentLikeId(commentId, userId);
        CommentLike existingDislike = new CommentLike();
        existingDislike.setIsLike(false);

        given(commentRepository.findById(commentId)).willReturn(Optional.of(comment));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(commentLikeRepository.findById(id)).willReturn(Optional.of(existingDislike));
        given(commentRepository.save(comment)).willReturn(comment);

        // When
        commentService.likeComment(commentId, userId);

        // Then
        assertEquals(1L, comment.getLikes());
        assertEquals(0L, comment.getDislikes());
    }

    @Test
    @DisplayName("Test disliking a comment that already has a like switches vote to dislike")
    public void givenExistingLike_whenDislikeComment_thenVoteIsSwitchedToDislike() {
        // Given
        Long commentId = 1L;
        String userId = "user1";

        Comment comment = new Comment();
        comment.setId(commentId);
        comment.setLikes(1L);
        comment.setDislikes(0L);

        User user = new User(); user.setId(userId);
        CommentLikeId id = new CommentLikeId(commentId, userId);
        CommentLike existingLike = new CommentLike();
        existingLike.setIsLike(true);

        given(commentRepository.findById(commentId)).willReturn(Optional.of(comment));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(commentLikeRepository.findById(id)).willReturn(Optional.of(existingLike));
        given(commentRepository.save(comment)).willReturn(comment);

        // When
        commentService.dislikeComment(commentId, userId);

        // Then
        assertEquals(0L, comment.getLikes());
        assertEquals(1L, comment.getDislikes());
    }

    @Test
    @DisplayName("Test removing a dislike decrements dislikes")
    public void givenExistingDislike_whenRemoveLikeOrDislike_thenDislikesDecremented() {
        // Given
        Long commentId = 1L;
        String userId = "user1";

        Comment comment = new Comment();
        comment.setId(commentId);
        comment.setDislikes(1L);

        CommentLikeId id = new CommentLikeId(commentId, userId);
        CommentLike dislike = new CommentLike();
        dislike.setIsLike(false);

        given(commentRepository.findById(commentId)).willReturn(Optional.of(comment));
        given(commentLikeRepository.findById(id)).willReturn(Optional.of(dislike));
        given(commentRepository.save(comment)).willReturn(comment);

        // When
        commentService.removeLikeOrDislike(commentId, userId);

        // Then
        assertEquals(0L, comment.getDislikes());
        then(commentLikeRepository).should().delete(dislike);
    }

    @Test
    @DisplayName("Test deleting a comment by unauthorized user throws exception")
    public void givenUnauthorizedUser_whenDeleteComment_thenThrowException() {
        // Given
        Long commentId = 1L;
        String requesterId = "user3";

        Comment comment = new Comment();
        User commentAuthor = new User(); commentAuthor.setId("user1");
        comment.setAuthor(commentAuthor);

        Post post = new Post();
        User postAuthor = new User(); postAuthor.setId("user2");
        post.setAuthor(postAuthor);
        comment.setPost(post);

        given(commentRepository.findById(commentId)).willReturn(Optional.of(comment));

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> commentService.deleteComment(commentId, requesterId));
        assertEquals("User is not authorized to delete this comment", ex.getMessage());
    }

    @Test
    @DisplayName("Test add comment when post not found throws exception")
    public void givenInvalidPostId_whenAddComment_thenThrowException() {
        // Given
        given(postRepository.findById(99L)).willReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class,
                () -> commentService.addComment(99L, "user1", new Comment()));
    }

    @Test
    @DisplayName("Test update comment when comment not found throws exception")
    public void givenInvalidCommentId_whenUpdateComment_thenThrowException() {
        // Given
        given(commentRepository.findById(99L)).willReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class,
                () -> commentService.updateComment(99L, "user1", "new content"));
    }

    @Test
    @DisplayName("Test delete comment when comment not found throws exception")
    public void givenInvalidCommentId_whenDeleteComment_thenThrowException() {
        // Given
        given(commentRepository.findById(99L)).willReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class,
                () -> commentService.deleteComment(99L, "user1"));
    }

    @Test
    @DisplayName("Test adding a comment on a post with no author sends no notification")
    public void givenPostWithNoAuthor_whenAddComment_thenNoNotificationSent() {
        // Given
        Long postId = 1L;
        String authorId = "user1";
        Comment comment = new Comment();

        Post post = new Post(); post.setId(postId); // no author set
        User author = new User(); author.setId(authorId);

        Comment savedComment = new Comment(); savedComment.setId(10L);

        given(postRepository.findById(postId)).willReturn(Optional.of(post));
        given(userRepository.findById(authorId)).willReturn(Optional.of(author));
        given(commentRepository.save(comment)).willReturn(savedComment);

        // When
        commentService.addComment(postId, authorId, comment);

        // Then
        then(notificationService).shouldHaveNoInteractions();
    }
}
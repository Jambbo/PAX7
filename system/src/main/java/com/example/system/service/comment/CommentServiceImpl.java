package com.example.system.service.comment;

import com.example.system.domain.model.Comment;
import com.example.system.domain.model.Post;
import com.example.system.domain.model.User;
import com.example.system.repository.CommentRepository;
import com.example.system.repository.PostRepository;
import com.example.system.repository.UserRepository;
import com.example.system.repository.CommentLikeRepository;
import com.example.system.domain.model.CommentLike;
import com.example.system.domain.model.CommentLikeId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentLikeRepository commentLikeRepository;

    @Override
    @Transactional
    public Comment addComment(Long postId, String authorId, Comment comment) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        comment.setPost(post);
        comment.setAuthor(author);

        return commentRepository.save(comment);
    }

    @Override
    @Transactional
    public Comment updateComment(Long commentId, String authorId, String newContent) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("User is not the author of this comment");
        }

        comment.setContent(newContent);
        comment.setIsEdited(true);

        return commentRepository.save(comment);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, String authorId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getAuthor().getId().equals(authorId)) {
            Post post = comment.getPost();
            if(!post.getAuthor().getId().equals(authorId)) {
                throw new RuntimeException("User is not authorized to delete this comment");
            }
        }

        commentRepository.delete(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Comment> getCommentsByPostId(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }

    @Override
    @Transactional
    public Comment likeComment(Long commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CommentLikeId id = new CommentLikeId(commentId, userId);
        commentLikeRepository.findById(id).ifPresentOrElse(
                existingLike -> {
                    if (!existingLike.getIsLike()) {
                        existingLike.setIsLike(true);
                        comment.setDislikes(comment.getDislikes() - 1);
                        comment.setLikes(comment.getLikes() + 1);
                        commentLikeRepository.save(existingLike);
                    }
                },
                () -> {
                    CommentLike newLike = CommentLike.builder()
                            .id(id)
                            .comment(comment)
                            .user(user)
                            .isLike(true)
                            .build();
                    commentLikeRepository.save(newLike);
                    comment.setLikes(comment.getLikes() + 1);
                }
        );

        return commentRepository.save(comment);
    }

    @Override
    @Transactional
    public Comment dislikeComment(Long commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CommentLikeId id = new CommentLikeId(commentId, userId);
        commentLikeRepository.findById(id).ifPresentOrElse(
                existingLike -> {
                    if (existingLike.getIsLike()) {
                        existingLike.setIsLike(false);
                        comment.setLikes(comment.getLikes() - 1);
                        comment.setDislikes(comment.getDislikes() + 1);
                        commentLikeRepository.save(existingLike);
                    }
                },
                () -> {
                    CommentLike newLike = CommentLike.builder()
                            .id(id)
                            .comment(comment)
                            .user(user)
                            .isLike(false)
                            .build();
                    commentLikeRepository.save(newLike);
                    comment.setDislikes(comment.getDislikes() + 1);
                }
        );

        return commentRepository.save(comment);
    }

    @Override
    @Transactional
    public Comment removeLikeOrDislike(Long commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        CommentLikeId id = new CommentLikeId(commentId, userId);
        commentLikeRepository.findById(id).ifPresent(existingLike -> {
            if (existingLike.getIsLike()) {
                comment.setLikes(comment.getLikes() - 1);
            } else {
                comment.setDislikes(comment.getDislikes() - 1);
            }
            commentLikeRepository.delete(existingLike);
        });

        return commentRepository.save(comment);
    }
}

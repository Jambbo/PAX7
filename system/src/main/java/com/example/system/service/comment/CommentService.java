package com.example.system.service.comment;

import com.example.system.domain.model.Comment;

import java.util.List;

public interface CommentService {
    Comment addComment(Long postId, String authorId, Comment comment);

    Comment updateComment(Long commentId, String authorId, String newContent);

    void deleteComment(Long commentId, String authorId);

    List<Comment> getCommentsByPostId(Long postId);

    Comment likeComment(Long commentId, String userId);

    Comment dislikeComment(Long commentId, String userId);

    Comment removeLikeOrDislike(Long commentId, String userId);
}

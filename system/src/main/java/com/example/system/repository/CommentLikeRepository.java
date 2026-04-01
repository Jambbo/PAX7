package com.example.system.repository;

import com.example.system.domain.model.CommentLike;
import com.example.system.domain.model.CommentLikeId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommentLikeRepository extends JpaRepository<CommentLike, CommentLikeId> {
    Optional<CommentLike> findByCommentIdAndUserId(Long commentId, String userId);
}


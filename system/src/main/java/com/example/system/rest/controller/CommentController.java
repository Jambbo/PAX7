package com.example.system.rest.controller;

import com.example.system.domain.model.Comment;
import com.example.system.rest.dto.comment.CommentReadResponseDto;
import com.example.system.rest.dto.comment.CommentWriteDto;
import com.example.system.rest.dto.mapper.CommentMapper;
import com.example.system.service.comment.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final CommentMapper commentMapper;

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<CommentReadResponseDto> addComment(
            @PathVariable Long postId,
            @Validated @RequestBody CommentWriteDto writeDto,
            @AuthenticationPrincipal Jwt jwt) {
        Comment commentToSave = commentMapper.toEntity(writeDto);
        Comment savedComment = commentService.addComment(postId, jwt.getSubject(), commentToSave);
        return ResponseEntity.status(HttpStatus.CREATED).body(commentMapper.toDto(savedComment));
    }

    @GetMapping
    public ResponseEntity<List<CommentReadResponseDto>> getCommentsByPost(@PathVariable Long postId) {
        List<Comment> comments = commentService.getCommentsByPostId(postId);
        return ResponseEntity.ok(commentMapper.toDto(comments));
    }

    @PreAuthorize("@ownership.isCommentOwner(#commentId) or hasRole('ADMIN')")
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentReadResponseDto> updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Validated @RequestBody CommentWriteDto writeDto,
            @AuthenticationPrincipal Jwt jwt) {
        Comment updatedComment = commentService.updateComment(commentId, jwt.getSubject(), writeDto.content());
        return ResponseEntity.ok(commentMapper.toDto(updatedComment));
    }

    @PreAuthorize("@ownership.isCommentOwner(#commentId) or hasRole('ADMIN')")
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Jwt jwt) {
        commentService.deleteComment(commentId, jwt.getSubject());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{commentId}/like")
    public ResponseEntity<CommentReadResponseDto> likeComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Jwt jwt) {
        Comment likedComment = commentService.likeComment(commentId, jwt.getSubject());
        return ResponseEntity.ok(commentMapper.toDto(likedComment));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{commentId}/dislike")
    public ResponseEntity<CommentReadResponseDto> dislikeComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Jwt jwt) {
        Comment dislikedComment = commentService.dislikeComment(commentId, jwt.getSubject());
        return ResponseEntity.ok(commentMapper.toDto(dislikedComment));
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{commentId}/interaction")
    public ResponseEntity<CommentReadResponseDto> removeInteraction(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Jwt jwt) {
        Comment updatedComment = commentService.removeLikeOrDislike(commentId, jwt.getSubject());
        return ResponseEntity.ok(commentMapper.toDto(updatedComment));
    }
}

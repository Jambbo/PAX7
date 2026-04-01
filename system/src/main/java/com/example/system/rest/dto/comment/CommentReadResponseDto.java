package com.example.system.rest.dto.comment;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CommentReadResponseDto(
        Long id,
        Long postId,
        String authorId,
        String authorUsername,
        String content,
        Long likes,
        Long dislikes,
        Boolean isEdited,
        String createdAt,
        String updatedAt
) {}


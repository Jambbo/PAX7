package com.example.system.rest.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentWriteDto(
        @NotBlank(message = "Content cannot be blank")
        @Size(max = 1000, message = "Content maximum length is 1000 characters")
        String content
) {}


package com.example.system.rest.dto.chat;

import com.example.system.rest.dto.user.UserReadResponseDto;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Set;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ConversationReadResponseDto(
        String id,
        boolean isGroup,
        String title,
        Set<UserReadResponseDto> members,
        LocalDateTime createdAt,
        boolean deleted
) {}


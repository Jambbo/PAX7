package com.example.system.rest.dto.user;

import com.example.system.domain.model.UserStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;


@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserReadResponseDto(
        String id,
        String username,
        String email,
        String firstName,
        String lastName,
        String bio,
        UserStatus status,
        boolean isProfilePrivate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {


}

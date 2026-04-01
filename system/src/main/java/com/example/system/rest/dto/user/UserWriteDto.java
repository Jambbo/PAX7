package com.example.system.rest.dto.user;

import com.example.system.domain.model.UserStatus;
import com.example.system.rest.validation.OnCreate;
import com.example.system.rest.validation.OnUpdate;
import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.Length;


public record UserWriteDto(

        @NotNull(message = "username must not be mull", groups = {OnUpdate.class, OnCreate.class})
        @Length(
                min = 3,
                max = 255,
                message = "Name length must be within a range of {min} and {max}.",
                groups = {OnCreate.class, OnUpdate.class}
        )
        String username,

        @Email(message = "email must be valid.",
                groups = {OnCreate.class, OnUpdate.class})
        @NotNull(message = "email must not be null",
                groups = {OnUpdate.class, OnCreate.class})
        @Length(max = 255, message = "email is too long.",
                groups = {OnCreate.class, OnUpdate.class})
        String email,


        @Length(max = 100, groups = {OnCreate.class, OnUpdate.class})
        String firstName,

        @Length(max = 100, groups = {OnCreate.class, OnUpdate.class})
        String lastName,

        @Length(max = 500, groups = {OnCreate.class, OnUpdate.class})
        String bio,

        UserStatus status,

        boolean isProfilePrivate

) {}

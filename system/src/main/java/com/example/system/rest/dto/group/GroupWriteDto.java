package com.example.system.rest.dto.group;

import com.example.system.domain.model.GroupPrivacy;
import com.example.system.rest.validation.OnCreate;
import com.example.system.rest.validation.OnUpdate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import org.hibernate.validator.constraints.Length;

public record GroupWriteDto(

        @Null(message = "id must be null.", groups = OnCreate.class)
        @NotNull(message = "id is must be not null.", groups = OnUpdate.class)
        Long id,

        @NotBlank(message = "name must be not null.", groups = OnCreate.class)
        @Length(
                max = 60,
                message = "name must be maximum {max} characters.",
                groups = {OnCreate.class, OnUpdate.class}
        )
        String name,

        @NotBlank(message = "description must be not null.", groups = OnCreate.class)
        @Length(
                max = 500,
                message = "description must be maximum {max} characters.",
                groups = {OnCreate.class, OnUpdate.class}
        )
        String description,

        @NotNull(message = "group privacy must be not null.", groups = OnCreate.class)
        GroupPrivacy groupPrivacy,

        @Length(max = 100, groups = {OnCreate.class, OnUpdate.class})
        String location,

        String ownerId

) {
}

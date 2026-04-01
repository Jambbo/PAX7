package com.example.system.rest.dto.post;

import com.example.system.rest.validation.OnCreate;
import com.example.system.rest.validation.OnUpdate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import org.hibernate.validator.constraints.Length;

public record PostWriteDto(
        @Null(message = "id must be null.", groups = OnCreate.class)
        @NotNull(message = "id is must be not null.", groups = OnUpdate.class)
        Long id,

        @NotBlank(message = "text must be not null.", groups = OnCreate.class)
        @Length(
                max = 200,
                message = "text must be maximum {max} characters.",
                groups = {OnCreate.class, OnUpdate.class}
        )
        String text,

        Long views,

        Long likes,

        @NotNull(message = "group id must be not null.", groups = {OnCreate.class, OnUpdate.class})
        Long groupId

) {


}

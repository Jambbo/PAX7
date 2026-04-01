package com.example.system.rest.dto.group;

import com.example.system.domain.model.GroupPrivacy;
import com.example.system.rest.validation.OnCreate;
import com.example.system.rest.validation.OnUpdate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.hibernate.validator.constraints.Length;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GroupDto {

    @Null(message = "id must be null on create.", groups = OnCreate.class)
    @NotNull(message = "id not null on update.", groups = OnUpdate.class)
    Long id;

    @NotBlank(
            message = "name must be not null.",
            groups = {OnCreate.class, OnUpdate.class}
    )
    @Length(min = 3, max = 255,
            message = "name length must be between {min} and {max}.",
            groups = {OnCreate.class, OnUpdate.class})
    String name;

    @Length(max = 500, groups = {OnCreate.class, OnUpdate.class})
    String description;

    @NotNull(message = "privacy must be not null.", groups = OnCreate.class)
    GroupPrivacy privacy;

    @Length(max = 255, groups = {OnCreate.class, OnUpdate.class})
    String location;

    @NotNull(message = "ownerId must be not null.", groups = OnCreate.class)
    Long ownerId;

    @Null(message = "memberCount must be null.", groups = {OnCreate.class, OnUpdate.class})
    Integer memberCount;

    @Null(message = "postCount must be null.", groups = {OnCreate.class, OnUpdate.class})
    Integer postCount;

    @Null(message = "createdAt must be null.", groups = {OnCreate.class, OnUpdate.class})
    String createdAt;

    @Null(message = "updatedAt must be null.", groups = {OnCreate.class, OnUpdate.class})
    String updatedAt;

}

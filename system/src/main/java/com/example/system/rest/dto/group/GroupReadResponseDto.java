package com.example.system.rest.dto.group;

import com.example.system.domain.model.GroupPrivacy;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GroupReadResponseDto {

    private Long id;
    private String name;
    private String description;
    private GroupPrivacy privacy;
    private String location;
    private String ownerId;
    private String ownerUsername;
    private Set<String> adminIds;
    private int memberCount;
    private int postCount;
    private boolean isJoined;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
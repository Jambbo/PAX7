package com.example.system.rest.controller;

import com.example.system.domain.model.Group;
import com.example.system.rest.dto.group.GroupReadResponseDto;
import com.example.system.rest.dto.group.GroupWriteDto;
import com.example.system.rest.dto.mapper.GroupMapper;
import com.example.system.rest.validation.OnCreate;
import com.example.system.rest.validation.OnUpdate;
import com.example.system.service.group.GroupService;
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
@RequiredArgsConstructor
@RequestMapping("/api/v1/groups")
public class GroupController {

    private final GroupService groupService;
    private final GroupMapper groupMapper;

    @PostMapping
    public ResponseEntity<GroupReadResponseDto> create(
            @Validated(OnCreate.class) @RequestBody GroupWriteDto dto,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Group group = groupMapper.toEntity(dto);
        Group saved = groupService.create(group, jwt.getSubject());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(groupMapper.toDto(saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupReadResponseDto> getById(@PathVariable Long id) {
        Group group = groupService.getById(id);
        return ResponseEntity.ok(groupMapper.toDto(group));
    }

    @PostMapping("/{groupId}/join")
    public ResponseEntity<Void> join(
            @PathVariable Long groupId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        groupService.joinUser(groupId, jwt.getSubject());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/all")
    public ResponseEntity<List<GroupReadResponseDto>> getAll(
            @AuthenticationPrincipal Jwt jwt
    ) {
        List<Group> groups = groupService.getAll(jwt);
        List<GroupReadResponseDto> groupsDto = groupMapper.toDto(groups);
        return ResponseEntity.ok(groupsDto);
    }

    @GetMapping("/me")
    public ResponseEntity<List<GroupReadResponseDto>> getMyGroups(
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        List<Group> groups = groupService.getUserGroups(userId);
        return ResponseEntity.ok(groupMapper.toDto(groups));
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Void> leave(
            @PathVariable Long groupId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        groupService.leaveUser(groupId, jwt.getSubject());
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("@ownership.isGroupOwner(#groupId)")
    @PutMapping("/{groupId}")
    public ResponseEntity<GroupReadResponseDto> update(
            @PathVariable Long groupId,
            @Validated(OnUpdate.class) @RequestBody GroupWriteDto dto
    ) {
        Group group = groupMapper.toEntity(dto);
        Group updated = groupService.update(groupId, group);
        return ResponseEntity.ok(groupMapper.toDto(updated));
    }

    @PreAuthorize("@ownership.isGroupOwner(#groupId) or hasRole('ADMIN')")
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> delete(@PathVariable Long groupId) {
        groupService.delete(groupId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<GroupReadResponseDto>> getByOwner(
            @PathVariable String ownerId
    ) {
        List<Group> groups = groupService.getByOwner(ownerId);
        return ResponseEntity.ok(groupMapper.toDto(groups));
    }
}

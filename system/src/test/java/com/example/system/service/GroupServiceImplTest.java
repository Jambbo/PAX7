package com.example.system.service;

import com.example.system.domain.model.Group;
import com.example.system.repository.GroupRepository;
import com.example.system.repository.UserRepository;
import com.example.system.service.group.GroupServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.*;

import com.example.system.domain.model.User;
import org.springframework.security.oauth2.jwt.Jwt;

@ExtendWith(MockitoExtension.class)
public class GroupServiceImplTest {

    @Mock private GroupRepository groupRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private GroupServiceImpl groupService;

    @Test
    @DisplayName("Test creating a group")
    public void givenGroupDataAndOwner_whenCreate_thenReturnCreatedGroup() {
        // Given
        String ownerId = "owner123";
        User owner = new User();
        owner.setId(ownerId);

        Group group = new Group();
        group.setAdmins(new HashSet<>());
        group.setMembers(new HashSet<>());

        given(userRepository.findById(ownerId)).willReturn(Optional.of(owner));
        given(groupRepository.save(any(Group.class))).willAnswer(invocation -> invocation.getArgument(0));

        // When
        Group result = groupService.create(group, ownerId);

        // Then
        assertNotNull(result);
        assertEquals(owner, result.getOwner());
        assertTrue(result.getAdmins().contains(owner));
        assertTrue(result.getMembers().contains(owner));
        assertEquals(1, result.getMemberCount());
        assertEquals(0, result.getPostCount());
        then(groupRepository).should().save(group);
    }

    @Test
    @DisplayName("Test creating a group with non-existent owner")
    public void givenInvalidOwner_whenCreate_thenThrowException() {
        // Given
        String ownerId = "invalid_owner";
        Group group = new Group();

        given(userRepository.findById(ownerId)).willReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> groupService.create(group, ownerId));
        assertEquals("Owner not found with id=" + ownerId, exception.getMessage());
        then(groupRepository).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("Test getting group by ID")
    public void givenGroupId_whenGetById_thenReturnGroup() {
        // Given
        Long groupId = 10L;
        Group group = new Group();
        group.setId(groupId);
        group.setName("Test Group");

        given(groupRepository.findById(groupId)).willReturn(Optional.of(group));

        // When
        Group result = groupService.getById(groupId);

        // Then
        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("Test Group", result.getName());
    }

    @Test
    @DisplayName("Test getting non-existent group by ID")
    public void givenInvalidGroupId_whenGetById_thenThrowException() {
        // Given
        Long groupId = 10L;

        given(groupRepository.findById(groupId)).willReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> groupService.getById(groupId));
        assertEquals("Group not found with id=" + groupId, exception.getMessage());
    }

    @Test
    @DisplayName("Test get all without Jwt")
    public void givenNullJwt_whenGetAll_thenReturnAllGroups() {
        // Given
        List<Group> groups = List.of(new Group(), new Group());
        given(groupRepository.findAll()).willReturn(groups);

        // When
        List<Group> result = groupService.getAll(null);

        // Then
        assertEquals(2, result.size());
        then(groupRepository).should().findAll();
    }

    @Test
    @DisplayName("Test get all with Jwt")
    public void givenJwt_whenGetAll_thenReturnGroupsNotMemberOf() {
        // Given
        String subject = "user1";
        Jwt jwt = mock(Jwt.class);
        given(jwt.getSubject()).willReturn(subject);

        List<Group> groups = List.of(new Group());
        given(groupRepository.findGroupsUserNotMemberOf(subject)).willReturn(groups);

        // When
        List<Group> result = groupService.getAll(jwt);

        // Then
        assertEquals(1, result.size());
        then(groupRepository).should().findGroupsUserNotMemberOf(subject);
    }

    @Test
    @DisplayName("Test get user groups")
    public void givenUserId_whenGetUserGroups_thenReturnGroups() {
        // Given
        String userId = "user1";
        List<Group> groups = List.of(new Group());
        given(groupRepository.findByMembers_Id(userId)).willReturn(groups);

        // When
        List<Group> result = groupService.getUserGroups(userId);

        // Then
        assertEquals(1, result.size());
        then(groupRepository).should().findByMembers_Id(userId);
    }

    @Test
    @DisplayName("Test get by owner")
    public void givenOwnerId_whenGetByOwner_thenReturnGroups() {
        // Given
        String ownerId = "owner1";
        List<Group> groups = List.of(new Group());
        given(groupRepository.findByOwnerId(ownerId)).willReturn(groups);

        // When
        List<Group> result = groupService.getByOwner(ownerId);

        // Then
        assertEquals(1, result.size());
        then(groupRepository).should().findByOwnerId(ownerId);
    }

    @Test
    @DisplayName("Test update group")
    public void givenGroupData_whenUpdate_thenReturnUpdatedGroup() {
        // Given
        Long groupId = 1L;
        Group existing = new Group();
        existing.setId(groupId);
        existing.setName("Old Name");

        Group updateData = new Group();
        updateData.setName("New Name");
        updateData.setDescription("New Desc");
        updateData.setPrivacy(null); // testing null check

        given(groupRepository.findById(groupId)).willReturn(Optional.of(existing));
        given(groupRepository.save(existing)).willReturn(existing);

        // When
        Group result = groupService.update(groupId, updateData);

        // Then
        assertEquals("New Name", result.getName());
        assertEquals("New Desc", result.getDescription());
        then(groupRepository).should().save(existing);
    }

    @Test
    @DisplayName("Test delete group")
    public void givenGroupId_whenDelete_thenRepositoryDeleteIsCalled() {
        // Given
        Long groupId = 1L;
        Group existing = new Group();
        given(groupRepository.findById(groupId)).willReturn(Optional.of(existing));

        // When
        groupService.delete(groupId);

        // Then
        then(groupRepository).should().delete(existing);
    }

    @Test
    @DisplayName("Test join user successfully")
    public void givenValidData_whenJoinUser_thenAddUserToMembers() {
        // Given
        Long groupId = 1L;
        String userId = "user1";

        Group group = new Group();
        group.setId(groupId);
        group.setMembers(new HashSet<>());
        group.setMemberCount(0);

        User user = new User();
        user.setId(userId);

        given(groupRepository.findById(groupId)).willReturn(Optional.of(group));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));

        // When
        groupService.joinUser(groupId, userId);

        // Then
        assertTrue(group.getMembers().contains(user));
        assertEquals(1, group.getMemberCount());
        then(groupRepository).should().save(group);
    }

    @Test
    @DisplayName("Test join user already member")
    public void givenAlreadyMember_whenJoinUser_thenDoNothing() {
        // Given
        Long groupId = 1L;
        String userId = "user1";

        User user = new User();
        user.setId(userId);

        Group group = new Group();
        group.setId(groupId);
        group.setMembers(new HashSet<>(List.of(user)));
        group.setMemberCount(1);

        given(groupRepository.findById(groupId)).willReturn(Optional.of(group));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));

        // When
        groupService.joinUser(groupId, userId);

        // Then
        assertEquals(1, group.getMemberCount());
        verify(groupRepository, never()).save(any(Group.class));
    }

    @Test
    @DisplayName("Test leave user successfully")
    public void givenValidData_whenLeaveUser_thenRemoveUserFromMembers() {
        // Given
        Long groupId = 1L;
        String userId = "user1";

        User user = new User();
        user.setId(userId);

        Group group = new Group();
        group.setId(groupId);
        group.setMembers(new HashSet<>(List.of(user)));
        group.setMemberCount(1);

        given(groupRepository.findById(groupId)).willReturn(Optional.of(group));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));

        // When
        groupService.leaveUser(groupId, userId);

        // Then
        assertFalse(group.getMembers().contains(user));
        assertEquals(0, group.getMemberCount());
        then(groupRepository).should().save(group);
    }

    @Test
    @DisplayName("Test leave user not a member")
    public void givenNotMember_whenLeaveUser_thenDoNothing() {
        // Given
        Long groupId = 1L;
        String userId = "user1";

        User user = new User();
        user.setId(userId);

        Group group = new Group();
        group.setId(groupId);
        group.setMembers(new HashSet<>());
        group.setMemberCount(0);

        given(groupRepository.findById(groupId)).willReturn(Optional.of(group));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));

        // When
        groupService.leaveUser(groupId, userId);

        // Then
        assertEquals(0, group.getMemberCount());
        verify(groupRepository, never()).save(any(Group.class));
    }
}
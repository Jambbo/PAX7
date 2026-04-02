package com.example.system.rest;

import com.example.system.domain.model.Group;
import com.example.system.rest.controller.GroupController;
import com.example.system.rest.dto.group.GroupReadResponseDto;
import com.example.system.rest.dto.group.GroupWriteDto;
import com.example.system.rest.dto.mapper.GroupMapper;
import com.example.system.service.group.GroupService;
import com.example.system.service.currentUser.CurrentUserService;
import com.example.system.rest.security.UserAuthorizationService;
import com.example.system.domain.model.GroupPrivacy;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.BDDMockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = GroupController.class)
public class GroupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GroupService groupService;

    @MockitoBean
    private GroupMapper groupMapper;

    @MockitoBean
    private CurrentUserService currentUserService;

    @MockitoBean
    private UserAuthorizationService userAuthorizationService;

    @Test
    public void givenDto_whenCreate_thenSuccess() throws Exception {
        //given
        GroupWriteDto dto = new GroupWriteDto(null, "Test Group", "Description", GroupPrivacy.PUBLIC, "Location", null);
        Group group = new Group();

        GroupReadResponseDto responseDto = GroupReadResponseDto.builder()
                .id(1L)
                .name("Test Group")
                .description("Description")
                .build();

        BDDMockito.given(groupMapper.toEntity(any(GroupWriteDto.class))).willReturn(group);
        BDDMockito.given(groupService.create(any(Group.class), anyString())).willReturn(group);
        BDDMockito.given(groupMapper.toDto(any(Group.class))).willReturn(responseDto);

        //when
        ResultActions response = mockMvc.perform(post("/api/v1/groups")
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)));

        //then
        response.andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Test Group"));
    }

    @Test
    public void givenId_whenGetById_thenSuccess() throws Exception {
        //given
        Group group = new Group();
        GroupReadResponseDto responseDto = GroupReadResponseDto.builder().id(1L).name("Test Group").build();

        BDDMockito.given(groupService.getById(1L)).willReturn(group);
        BDDMockito.given(groupMapper.toDto(any(Group.class))).willReturn(responseDto);

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/groups/{id}", 1L)
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Group"));
    }

    @Test
    public void givenId_whenJoin_thenSuccess() throws Exception {
        //given
        BDDMockito.doNothing().when(groupService).joinUser(anyLong(), anyString());

        //when
        ResultActions response = mockMvc.perform(post("/api/v1/groups/{groupId}/join", 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf()));

        //then
        response.andExpect(status().isOk());
    }

    @Test
    public void whenGetAll_thenSuccess() throws Exception {
        //given
        BDDMockito.given(groupService.getAll(any(Jwt.class))).willReturn(List.of(new Group()));
        GroupReadResponseDto responseDto = GroupReadResponseDto.builder().id(1L).name("Test Group").build();
        BDDMockito.given(groupMapper.toDto((List<Group>) any())).willReturn(List.of(responseDto));

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/groups/all")
                .with(jwt().jwt(jwt -> jwt.subject("userId"))));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1));
    }

    @Test
    public void whenGetMyGroups_thenSuccess() throws Exception {
        //given
        BDDMockito.given(groupService.getUserGroups(anyString())).willReturn(List.of(new Group()));
        GroupReadResponseDto responseDto = GroupReadResponseDto.builder().id(1L).name("My Group").build();
        BDDMockito.given(groupMapper.toDto((List<Group>) any())).willReturn(List.of(responseDto));

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/groups/me")
                .with(jwt().jwt(jwt -> jwt.subject("userId"))));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].name").value("My Group"));
    }

    @Test
    public void givenId_whenLeave_thenSuccess() throws Exception {
        //given
        BDDMockito.doNothing().when(groupService).leaveUser(anyLong(), anyString());

        //when
        ResultActions response = mockMvc.perform(post("/api/v1/groups/{groupId}/leave", 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf()));

        //then
        response.andExpect(status().isOk());
    }

    @Test
    public void givenDto_whenUpdate_thenSuccess() throws Exception {
        //given
        GroupWriteDto dto = new GroupWriteDto(1L, "Updated Group", "Desc", GroupPrivacy.PUBLIC, "Loc", null);
        Group group = new Group();
        GroupReadResponseDto responseDto = GroupReadResponseDto.builder().id(1L).name("Updated Group").build();

        BDDMockito.given(groupMapper.toEntity(any(GroupWriteDto.class))).willReturn(group);
        BDDMockito.given(groupService.update(anyLong(), any(Group.class))).willReturn(group);
        BDDMockito.given(groupMapper.toDto(any(Group.class))).willReturn(responseDto);

        //when
        ResultActions response = mockMvc.perform(put("/api/v1/groups/{groupId}", 1L)
                .with(jwt())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Group"));
    }

    @Test
    public void givenId_whenDelete_thenSuccess() throws Exception {
        //given
        BDDMockito.doNothing().when(groupService).delete(1L);

        //when
        ResultActions response = mockMvc.perform(delete("/api/v1/groups/{groupId}", 1L)
                .with(jwt())
                .with(csrf()));

        //then
        response.andExpect(status().isNoContent());
    }

    @Test
    public void givenOwnerId_whenGetByOwner_thenSuccess() throws Exception {
        //given
        BDDMockito.given(groupService.getByOwner(anyString())).willReturn(List.of(new Group()));
        GroupReadResponseDto responseDto = GroupReadResponseDto.builder().id(1L).name("Owner Group").build();
        BDDMockito.given(groupMapper.toDto((List<Group>) any())).willReturn(List.of(responseDto));

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/groups/owner/{ownerId}", "ownerId")
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].name").value("Owner Group"));
    }
}


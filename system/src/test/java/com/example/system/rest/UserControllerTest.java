package com.example.system.rest;

import com.example.system.domain.model.User;
import com.example.system.domain.model.UserStatus;
import com.example.system.rest.controller.UserController;
import com.example.system.rest.dto.mapper.PostMapper;
import com.example.system.rest.dto.mapper.UserMapper;
import com.example.system.rest.dto.user.UserReadResponseDto;
import com.example.system.rest.dto.user.UserWriteDto;
import com.example.system.service.user.UserService;
import com.example.system.service.currentUser.CurrentUserService;
import com.example.system.rest.security.UserAuthorizationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mockito.BDDMockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest(controllers = UserController.class)
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserMapper userMapper;

    @MockitoBean
    private PostMapper postMapper;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private CurrentUserService currentUserService;

    @MockitoBean
    private UserAuthorizationService userAuthorizationService;

    @Test
    public void givenUserDto_whenUpdateUser_thenSuccessResponse() throws Exception {
        //given
        UserWriteDto userWriteDto = new UserWriteDto(
                "newUsername",
                "new@email.com",
                "FirstName",
                "LastName",
                "Bio",
                null,
                false
        );

        User entity = new User();
        entity.setUsername("newUsername");
        entity.setEmail("new@email.com");

        BDDMockito.given(userMapper.toEntity(any(UserWriteDto.class))).willReturn(entity);
        BDDMockito.given(userMapper.toDto(any(User.class))).willReturn(
                new UserReadResponseDto("id", "newUsername", "new@email.com", null, null, null, null, false, null, null));
        BDDMockito.given(userService.update(anyString(), any(UserWriteDto.class)))
                .willReturn(entity);

        //when
        ResultActions resultActions = mockMvc.perform(
                put("/api/v1/users/{id}", "oldUsername")
                        .with(jwt().jwt(jwt -> jwt.subject("oldUsername")))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userWriteDto)));

        //then
        resultActions.andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("newUsername"))
                .andExpect(jsonPath("$.email").value("new@email.com"))
                .andDo(MockMvcResultHandlers.print());
    }

    @Test
    public void givenUserId_whenGetById_thenSuccessResponse() throws Exception {
        //given
        String userId = "userId";
        User user = new User();
        BDDMockito.given(userService.getUserById(userId)).willReturn(user);
        BDDMockito.given(userMapper.toDto(user)).willReturn(
                new UserReadResponseDto(userId, "testUser", "test@test.com", null, null, null, null, false, null, null)
        );

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/users/{id}", userId)
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testUser"));
    }

    @Test
    public void whenCountUsers_thenReturnsLong() throws Exception {
        //given
        BDDMockito.given(userService.getUsersCount()).willReturn(10L);

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/users/count").with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$").value(10));
    }

    @Test
    public void whenGetAllUsers_thenReturnsList() throws Exception {
        //given
        BDDMockito.given(userService.findAll()).willReturn(List.of(new User()));
        BDDMockito.given(userMapper.toDto((List<User>) any())).willReturn(List.of(
                new UserReadResponseDto("id", "testUser", "test@test.com", null, null, null, null, false, null, null)
        ));

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/users").with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].username").value("testUser"));
    }

    @Test
    public void givenUsername_whenGetByUsername_thenSuccess() throws Exception {
        //given
        String username = "testUser";
        User user = new User();
        BDDMockito.given(userService.getByUsername(username)).willReturn(user);
        BDDMockito.given(userMapper.toDto(user)).willReturn(
                new UserReadResponseDto("id", username, "test@test.com", null, null, null, null, false, null, null)
        );

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/users/username/{username}", username).with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username));
    }

    @Test
    public void givenUsername_whenCheckUsernameAvailability_thenSuccess() throws Exception {
        //given
        String username = "testUser";
        BDDMockito.given(userService.existsByUsername(username)).willReturn(false);

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/users/check-username/{username}", username).with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(false))
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    public void givenUserId_whenDelete_thenSuccess() throws Exception {
        //given
        String userId = "userId";
        BDDMockito.given(userAuthorizationService.isAdmin()).willReturn(true);
        BDDMockito.doNothing().when(userService).deleteUser(userId);

        //when
        // Must bypass isAdmin check via test security context or mock
        ResultActions response = mockMvc.perform(delete("/api/v1/users/{id}", userId)
                .with(jwt())
                .with(csrf()));

        //then
        response.andExpect(status().isNoContent());
    }

    @Test
    public void givenJwt_whenUpdateMyStatus_thenSuccess() throws Exception {
        //given
        User user = new User();
        BDDMockito.given(userService.updateStatus(anyString(), any(UserStatus.class))).willReturn(user);
        BDDMockito.given(userMapper.toDto(user)).willReturn(
                new UserReadResponseDto("id", "testUser", null, null, null, null, UserStatus.ONLINE, false, null, null)
        );

        Map<String, String> statusMap = Map.of("status", "ONLINE");

        //when
        ResultActions response = mockMvc.perform(patch("/api/v1/users/me/status")
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusMap)));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ONLINE"));
    }

    @Test
    public void givenJwt_whenToggleMyPrivacy_thenSuccess() throws Exception {
        //given
        User user = new User();
        user.setProfilePrivate(true);
        BDDMockito.given(userService.toggleProfilePrivacy("userId")).willReturn(user);

        //when
        ResultActions response = mockMvc.perform(patch("/api/v1/users/me/profile-privacy")
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf()));

        //then
        response.andExpect(status().isOk());
    }

    @Test
    public void givenJwtAndQuery_whenSearch_thenSuccess() throws Exception {
        //given
        BDDMockito.given(userService.search(anyString(), anyString())).willReturn(List.of(new User()));
        BDDMockito.given(userMapper.toDto((List<User>) any())).willReturn(List.of(
                new UserReadResponseDto("id", "testUser", null, null, null, null, null, false, null, null)
        ));

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/users/search")
                .param("username", "test")
                .with(jwt().jwt(jwt -> jwt.subject("userId"))));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1));
    }

    @Test
    public void givenJwt_whenGetLatest_thenSuccess() throws Exception {
        //given
        BDDMockito.given(userService.findLatestUsers(anyInt())).willReturn(List.of());
        BDDMockito.given(userMapper.toDto((List<User>) any())).willReturn(List.of());

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/users/latest")
                .param("limit", "5")
                .with(jwt().jwt(jwt -> jwt.subject("userId"))));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(0));
    }

    @Test
    public void givenJwt_whenGetMyLikedPosts_thenSuccess() throws Exception {
        //given
        BDDMockito.given(userService.getLikedPostsByUserId(anyString())).willReturn(List.of());
        BDDMockito.given(postMapper.toDto((List<com.example.system.domain.model.Post>) any())).willReturn(List.of());

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/users/likedPosts")
                .with(jwt().jwt(jwt -> jwt.subject("userId"))));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(0));
    }

    @Test
    public void givenUserId_whenGetLikedPostsByUserId_thenSuccess() throws Exception {
        //given
        String userId = "userId";
        BDDMockito.given(userService.getLikedPostsByUserId(userId)).willReturn(List.of());
        BDDMockito.given(postMapper.toDto((List<com.example.system.domain.model.Post>) any())).willReturn(List.of());

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/users/{userId}/likedPosts", userId)
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(0));
    }

}

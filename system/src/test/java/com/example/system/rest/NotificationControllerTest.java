package com.example.system.rest;

import com.example.system.domain.model.notification.Notification;
import com.example.system.rest.controller.NotificationController;
import com.example.system.rest.dto.mapper.NotificationMapper;
import com.example.system.rest.dto.notification.NotificationReadResponseDto;
import com.example.system.service.notification.NotificationService;
import com.example.system.service.currentUser.CurrentUserService;
import com.example.system.rest.security.UserAuthorizationService;
import org.junit.jupiter.api.Test;
import org.mockito.BDDMockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = NotificationController.class)
public class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NotificationService notificationService;

    @MockitoBean
    private NotificationMapper notificationMapper;

    @MockitoBean
    private CurrentUserService currentUserService;

    @MockitoBean
    private UserAuthorizationService userAuthorizationService;

    @Test
    public void whenGetNotifications_thenSuccess() throws Exception {
        //given
        BDDMockito.given(currentUserService.getCurrentUserId()).willReturn("userId");
        Page<Notification> page = new PageImpl<>(List.of(new Notification()));
        BDDMockito.given(notificationService.getNotificationsForUser(anyString(), any(Pageable.class))).willReturn(page);

        NotificationReadResponseDto dto = new NotificationReadResponseDto();
        dto.setId(1L);
        BDDMockito.given(notificationMapper.toReadResponseDto(any(Notification.class))).willReturn(dto);

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/notifications")
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1L));
    }

    @Test
    public void whenSyncNotifications_thenSuccess() throws Exception {
        //given
        BDDMockito.given(currentUserService.getCurrentUserId()).willReturn("userId");
        BDDMockito.given(notificationService.getMissedNotifications(anyString(), anyLong())).willReturn(List.of(new Notification()));

        NotificationReadResponseDto dto = new NotificationReadResponseDto();
        dto.setId(1L);
        BDDMockito.given(notificationMapper.toReadResponseDto(any(Notification.class))).willReturn(dto);

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/notifications/sync")
                .param("lastId", "0")
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1));
    }

    @Test
    public void givenId_whenMarkAsRead_thenSuccess() throws Exception {
        //given
        BDDMockito.given(currentUserService.getCurrentUserId()).willReturn("userId");
        BDDMockito.doNothing().when(notificationService).markAsRead(anyLong(), anyString());

        //when
        ResultActions response = mockMvc.perform(put("/api/v1/notifications/{id}/read", 1L)
                .with(jwt())
                .with(csrf()));

        //then
        response.andExpect(status().isNoContent());
    }

    @Test
    public void whenMarkAllAsRead_thenSuccess() throws Exception {
        //given
        BDDMockito.given(currentUserService.getCurrentUserId()).willReturn("userId");
        BDDMockito.doNothing().when(notificationService).markAllAsRead(anyString());

        //when
        ResultActions response = mockMvc.perform(put("/api/v1/notifications/read-all")
                .with(jwt())
                .with(csrf()));

        //then
        response.andExpect(status().isNoContent());
    }

    @Test
    public void givenId_whenDeleteNotification_thenSuccess() throws Exception {
        //given
        BDDMockito.given(currentUserService.getCurrentUserId()).willReturn("userId");
        BDDMockito.doNothing().when(notificationService).deleteNotification(anyLong(), anyString());

        //when
        ResultActions response = mockMvc.perform(delete("/api/v1/notifications/{id}", 1L)
                .with(jwt())
                .with(csrf()));

        //then
        response.andExpect(status().isNoContent());
    }

    @Test
    public void whenDeleteAll_thenSuccess() throws Exception {
        //given
        BDDMockito.given(currentUserService.getCurrentUserId()).willReturn("userId");
        BDDMockito.doNothing().when(notificationService).deleteAllNotifications(anyString());

        //when
        ResultActions response = mockMvc.perform(delete("/api/v1/notifications")
                .with(jwt())
                .with(csrf()));

        //then
        response.andExpect(status().isNoContent());
    }
}

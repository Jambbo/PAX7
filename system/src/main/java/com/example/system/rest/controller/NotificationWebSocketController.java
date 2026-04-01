package com.example.system.rest.controller;

import com.example.system.rest.dto.notification.NotificationReadResponseDto;
import com.example.system.rest.dto.notification.NotificationSyncRequest;
import com.example.system.rest.dto.mapper.NotificationMapper;
import com.example.system.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.List;

@Controller
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketController {

    private final NotificationService notificationService;
    private final NotificationMapper notificationMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/notifications.sync")
    @Transactional
    public void handleSync(@Payload NotificationSyncRequest request, SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            log.warn("Unauthorized attempt to sync notifications via WebSocket");
            return;
        }

        String userId = String.valueOf(principal.getName());
        Long lastId = request.getLastMessageId() != null ? request.getLastMessageId() : 0L;

        List<NotificationReadResponseDto> missedNotifications = notificationService.getMissedNotifications(userId, lastId)
                .stream()
                .map(notificationMapper::toReadResponseDto)
                .toList();

        missedNotifications.forEach(notification ->
                messagingTemplate.convertAndSendToUser(
                        userId,
                        "/queue/notifications",
                        notification
                )
        );
        log.info("Synced {} notifications for user: {}", missedNotifications.size(), userId);
    }
}
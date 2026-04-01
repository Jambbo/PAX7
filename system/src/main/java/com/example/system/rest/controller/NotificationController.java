
package com.example.system.rest.controller;

import com.example.system.rest.dto.mapper.NotificationMapper;
import com.example.system.rest.dto.notification.NotificationReadResponseDto;
import com.example.system.service.currentUser.CurrentUserService;
import com.example.system.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationMapper notificationMapper;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<Page<NotificationReadResponseDto>> getNotifications(Pageable pageable) {
        String currentUserId = currentUserService.getCurrentUserId();
        Page<NotificationReadResponseDto> notifications = notificationService.getNotificationsForUser(currentUserId, pageable)
                .map(notificationMapper::toReadResponseDto);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/sync")
    public ResponseEntity<List<NotificationReadResponseDto>> syncNotifications(
            @RequestParam(name = "lastId", defaultValue = "0") Long lastNotificationId) {
        String currentUserId = currentUserService.getCurrentUserId();
        List<NotificationReadResponseDto> missed = notificationService.getMissedNotifications(currentUserId, lastNotificationId)
                .stream()
                .map(notificationMapper::toReadResponseDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(missed);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        String currentUserId = currentUserService.getCurrentUserId();
        notificationService.markAsRead(id, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        String currentUserId = currentUserService.getCurrentUserId();
        notificationService.markAllAsRead(currentUserId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        String currentUserId = currentUserService.getCurrentUserId();
        notificationService.deleteNotification(id, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllNotifications() {
        String currentUserId = currentUserService.getCurrentUserId();
        notificationService.deleteAllNotifications(currentUserId);
        return ResponseEntity.noContent().build();
    }
}
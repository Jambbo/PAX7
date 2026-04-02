package com.example.system.service;

import com.example.system.domain.model.User;
import com.example.system.domain.model.notification.Notification;
import com.example.system.repository.NotificationRepository;
import com.example.system.repository.UserRepository;
import com.example.system.rest.dto.mapper.NotificationMapper;
import com.example.system.rest.dto.notification.NotificationReadResponseDto;
import com.example.system.domain.model.notification.NotificationStatus;
import com.example.system.domain.model.notification.NotificationType;
import com.example.system.service.notification.NotificationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceImplTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private NotificationMapper notificationMapper;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @Test
    @DisplayName("Test getting notifications for user")
    public void givenUserIdAndPageable_whenGetNotifications_thenReturnPage() {
        // Given
        String userId = "user1";
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.Pageable.unpaged();
        org.springframework.data.domain.Page<Notification> page = org.springframework.data.domain.Page.empty();

        given(notificationRepository.findAllByRecipientId(userId, pageable)).willReturn(page);

        // When
        org.springframework.data.domain.Page<Notification> result = notificationService.getNotificationsForUser(userId, pageable);

        // Then
        assertEquals(page, result);
        then(notificationRepository).should().findAllByRecipientId(userId, pageable);
    }

    @Test
    @DisplayName("Test creating a notification")
    public void givenValidData_whenCreateNotification_thenSaveAndSendWebSocketMessage() {
        // Given
        String recipientId = "user1";
        String senderId = "user2";

        User recipient = new User();
        recipient.setId(recipientId);

        User sender = new User();
        sender.setId(senderId);

        Notification notification = new Notification();
        notification.setId(10L);

        NotificationReadResponseDto dto = new NotificationReadResponseDto();

        given(userRepository.findById(recipientId)).willReturn(Optional.of(recipient));
        given(userRepository.findById(senderId)).willReturn(Optional.of(sender));
        given(notificationRepository.save(any(Notification.class))).willReturn(notification);
        given(notificationMapper.toReadResponseDto(notification)).willReturn(dto);

        // When
        Notification result = notificationService.createNotification(recipientId, senderId, NotificationType.NEW_MESSAGE, "ref1");

        // Then
        assertNotNull(result);
        assertEquals(10L, result.getId());
        then(notificationRepository).should().save(any(Notification.class));
        then(messagingTemplate).should().convertAndSendToUser(recipientId, "/queue/notifications", dto);
    }

    @Test
    @DisplayName("Test creating a notification for self")
    public void givenSameSenderAndRecipient_whenCreateNotification_thenReturnNull() {
        // Given
        String recipientId = "user1";
        String senderId = "user1";

        // When
        Notification result = notificationService.createNotification(recipientId, senderId, NotificationType.NEW_MESSAGE, "ref1");

        // Then
        assertNull(result);
        then(notificationRepository).shouldHaveNoInteractions();
        then(messagingTemplate).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("Test getting missed notifications")
    public void givenUserIdAndLastMessageId_whenGetMissedNotifications_thenReturnList() {
        // Given
        String userId = "user1";
        Long lastMessageId = 1L;
        List<Notification> list = List.of(new Notification());

        given(notificationRepository.findAllByRecipientIdAndIdGreaterThanOrderByIdAsc(userId, lastMessageId)).willReturn(list);

        // When
        List<Notification> result = notificationService.getMissedNotifications(userId, lastMessageId);

        // Then
        assertEquals(1, result.size());
        then(notificationRepository).should().findAllByRecipientIdAndIdGreaterThanOrderByIdAsc(userId, lastMessageId);
    }

    @Test
    @DisplayName("Test mark notification as read")
    public void givenValidNotification_whenMarkAsRead_thenStatusIsUpdated() {
        // Given
        Long notificationId = 1L;
        String userId = "user1";

        User recipient = new User();
        recipient.setId(userId);

        Notification notification = new Notification();
        notification.setId(notificationId);
        notification.setRecipient(recipient);
        notification.setStatus(NotificationStatus.UNREAD);

        given(notificationRepository.findById(notificationId)).willReturn(Optional.of(notification));

        // When
        notificationService.markAsRead(notificationId, userId);

        // Then
        assertEquals(NotificationStatus.READ, notification.getStatus());
        then(notificationRepository).should().save(notification);
    }

    @Test
    @DisplayName("Test mark all notifications as read")
    public void givenUnreadNotifications_whenMarkAllAsRead_thenUpdateAndSaveAll() {
        // Given
        String userId = "user1";

        Notification unread1 = new Notification();
        unread1.setStatus(NotificationStatus.UNREAD);

        Notification read1 = new Notification();
        read1.setStatus(NotificationStatus.READ);

        org.springframework.data.domain.Page<Notification> page = new org.springframework.data.domain.PageImpl<>(List.of(unread1, read1));

        given(notificationRepository.findAllByRecipientId(eq(userId), any(org.springframework.data.domain.Pageable.class))).willReturn(page);

        // When
        notificationService.markAllAsRead(userId);

        // Then
        assertEquals(NotificationStatus.READ, unread1.getStatus());
        then(notificationRepository).should().saveAll(anyList());
    }

    @Test
    @DisplayName("Test delete notification")
    public void givenValidIdAndUser_whenDeleteNotification_thenRepositoryDeleteIsCalled() {
        // Given
        Long notificationId = 1L;
        String userId = "user1";

        User recipient = new User();
        recipient.setId(userId);

        Notification notification = new Notification();
        notification.setId(notificationId);
        notification.setRecipient(recipient);

        given(notificationRepository.findById(notificationId)).willReturn(Optional.of(notification));

        // When
        notificationService.deleteNotification(notificationId, userId);

        // Then
        then(notificationRepository).should().delete(notification);
    }

    @Test
    @DisplayName("Test delete all notifications for user")
    public void givenUserId_whenDeleteAllNotifications_thenRepositoryDeleteAllIsCalled() {
        // Given
        String userId = "user123";

        // When
        notificationService.deleteAllNotifications(userId);

        // Then
        then(notificationRepository).should().deleteAllByRecipientId(userId);
    }
}
package com.example.system.service.notification;

import com.example.system.domain.model.notification.Notification;
import com.example.system.domain.model.notification.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;


public interface NotificationService {
    Notification createNotification(String recipientId, String senderId, NotificationType type, String referenceId);
    Page<Notification> getNotificationsForUser(String userId, Pageable pageable);
    List<Notification> getMissedNotifications(String userId, Long lastMessageId);
    void markAsRead(Long notificationId, String userId);
    void markAllAsRead(String userId);
    void deleteNotification(Long notificationId, String userId);
    void deleteAllNotifications(String userId);
}
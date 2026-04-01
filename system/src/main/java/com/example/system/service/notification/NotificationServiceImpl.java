
package com.example.system.service.notification;

import com.example.system.domain.model.User;
import com.example.system.domain.model.exception.ResourceNotFoundException;
import com.example.system.domain.model.notification.Notification;
import com.example.system.domain.model.notification.NotificationStatus;
import com.example.system.domain.model.notification.NotificationType;
import com.example.system.repository.NotificationRepository;
import com.example.system.repository.UserRepository;
import com.example.system.rest.dto.mapper.NotificationMapper;
import com.example.system.rest.dto.notification.NotificationReadResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationMapper notificationMapper;

    @Override
    public Notification createNotification(String recipientId, String senderId, NotificationType type, String referenceId) {
        if (recipientId.equals(senderId)) {
            return null; // Don't notify self
        }

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));
        User sender = null;
        if (senderId != null) {
            sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(type)
                .status(NotificationStatus.UNREAD)
                .referenceId(referenceId)
                .build();

        Notification saved = notificationRepository.save(notification);

        NotificationReadResponseDto dto = notificationMapper.toReadResponseDto(saved);

        // Push over WebSocket
        messagingTemplate.convertAndSendToUser(
                recipientId,
                "/queue/notifications",
                dto
        );

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> getNotificationsForUser(String userId, Pageable pageable) {
        return notificationRepository.findAllByRecipientId(userId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getMissedNotifications(String userId, Long lastMessageId) {
        return notificationRepository.findAllByRecipientIdAndIdGreaterThanOrderByIdAsc(userId, lastMessageId);
    }

    @Override
    public void markAsRead(Long notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new IllegalArgumentException("Cannot update another user's notification");
        }

        notification.setStatus(NotificationStatus.READ);
        notificationRepository.save(notification);
    }

    @Override
    public void markAllAsRead(String userId) {
        // Simple implementation, could be optimized with a custom query
        List<Notification> unread = notificationRepository.findAllByRecipientId(userId, Pageable.unpaged()).getContent()
                .stream()
                .filter(n -> n.getStatus() == NotificationStatus.UNREAD)
                .toList();

        unread.forEach(n -> n.setStatus(NotificationStatus.READ));
        notificationRepository.saveAll(unread);
    }

    @Override
    public void deleteNotification(Long notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new IllegalArgumentException("Cannot delete another user's notification");
        }

        notificationRepository.delete(notification);
    }

    @Override
    public void deleteAllNotifications(String userId) {
        notificationRepository.deleteAllByRecipientId(userId);
    }
}
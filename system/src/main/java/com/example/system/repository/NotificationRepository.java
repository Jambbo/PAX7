package com.example.system.repository;

import com.example.system.domain.model.notification.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findAllByRecipientId(String recipientId, Pageable pageable);

    List<Notification> findAllByRecipientIdAndIdGreaterThanOrderByIdAsc(String recipientId, Long lastMessageId);

    List<Notification> findByRecipientAndStatus(com.example.system.domain.model.User recipient, com.example.system.domain.model.notification.NotificationStatus status);

    List<Notification> findBySenderAndType(com.example.system.domain.model.User sender, com.example.system.domain.model.notification.NotificationType type);

    java.util.Optional<Notification> findBySenderAndRecipientAndTypeAndStatus(com.example.system.domain.model.User sender, com.example.system.domain.model.User recipient, com.example.system.domain.model.notification.NotificationType type, com.example.system.domain.model.notification.NotificationStatus status);

    List<Notification> findBySenderAndRecipientAndType(com.example.system.domain.model.User sender, com.example.system.domain.model.User recipient, com.example.system.domain.model.notification.NotificationType type);

    void deleteAllByRecipientId(String recipientId);
}
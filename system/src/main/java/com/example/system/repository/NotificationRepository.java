package com.example.system.repository;

import com.example.system.domain.model.notification.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findAllByRecipientId(String recipientId, Pageable pageable);

    List<Notification> findAllByRecipientIdAndIdGreaterThanOrderByIdAsc(String recipientId, Long lastMessageId);

    void deleteAllByRecipientId(String recipientId);
}
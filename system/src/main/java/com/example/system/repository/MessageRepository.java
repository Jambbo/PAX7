package com.example.system.repository;

import com.example.system.domain.model.chat.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, String> {

    Page<Message> findByConversationIdAndDeletedFalse(
            String conversationId,
            Pageable pageable
    );
}
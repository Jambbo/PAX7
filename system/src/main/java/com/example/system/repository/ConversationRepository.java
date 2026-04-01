package com.example.system.repository;

import com.example.system.domain.model.chat.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, String> {

    @Query("""
        SELECT c FROM Conversation c
        JOIN c.members m1
        JOIN c.members m2
        WHERE c.isGroup = false
        AND m1.id = :user1
        AND m2.id = :user2
    """)
    Optional<Conversation> findPrivateConversation(String user1, String user2);

    @Query("""
        SELECT c FROM Conversation c
        JOIN c.members m
        WHERE m.id = :userId AND c.deleted = false
        ORDER BY c.createdAt DESC
    """)
    java.util.List<Conversation> findConversationsByUserId(String userId);
}
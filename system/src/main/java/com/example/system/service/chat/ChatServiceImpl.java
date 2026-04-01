package com.example.system.service.chat;

import com.example.system.domain.model.User;
import com.example.system.domain.model.chat.Conversation;
import com.example.system.domain.model.chat.Message;
import com.example.system.domain.model.chat.MessageStatus;
import com.example.system.domain.model.notification.NotificationType;
import com.example.system.repository.ConversationRepository;
import com.example.system.repository.MessageRepository;
import com.example.system.repository.UserRepository;
import com.example.system.rest.dto.chat.ChatMessageRequest;
import com.example.system.service.notification.NotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService{
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public java.util.List<Conversation> getUserConversations(String userId) {
        return conversationRepository.findConversationsByUserId(userId);
    }

    @Override
    @Transactional
    public Message sendMessage(String senderId, ChatMessageRequest request) {

        Conversation conversation =
                conversationRepository.findPrivateConversation(
                        senderId,
                        request.recipientId()
                ).orElseGet(() -> createConversation(senderId, request.recipientId()));

        User sender = userRepository.getReferenceById(senderId);

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.content())
                .status(MessageStatus.SENT)
                .createdAt(LocalDateTime.now())
                .deleted(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        notificationService.createNotification(
                request.recipientId(),
                senderId,
                NotificationType.NEW_MESSAGE,
                savedMessage.getId()
        );

        return savedMessage;
    }

    private Conversation createConversation(String user1, String user2) {
        User u1 = userRepository.getReferenceById(user1);
        User u2 = userRepository.getReferenceById(user2);

        Conversation c = Conversation.builder()
                .members(new HashSet<>())
                .isGroup(false)
                .createdAt(LocalDateTime.now())
                .build();

        c.getMembers().add(u1);
        c.getMembers().add(u2);

        return conversationRepository.save(c);
    }
}

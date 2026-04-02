package com.example.system.service;

import com.example.system.domain.model.User;
import com.example.system.domain.model.chat.Conversation;
import com.example.system.domain.model.chat.Message;
import com.example.system.domain.model.notification.NotificationType;
import com.example.system.repository.ConversationRepository;
import com.example.system.repository.MessageRepository;
import com.example.system.repository.UserRepository;
import com.example.system.rest.dto.chat.ChatMessageRequest;
import com.example.system.service.chat.ChatServiceImpl;
import com.example.system.service.notification.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class ChatServiceImplTest {

    @Mock private ConversationRepository conversationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ChatServiceImpl chatService;

    @Test
    @DisplayName("Test getting user conversations")
    public void givenUserId_whenGetUserConversations_thenReturnConversationsList() {
        // Given
        String userId = "user123";
        Conversation conversation = new Conversation();
        conversation.setId("conv1");

        List<Conversation> convs = List.of(conversation);
        given(conversationRepository.findConversationsByUserId(userId)).willReturn(convs);

        // When
        List<Conversation> result = chatService.getUserConversations(userId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("conv1", result.getFirst().getId());
    }

    @Test
    @DisplayName("Test sending message with existing conversation")
    public void givenExistingConversation_whenSendMessage_thenSaveMessageAndGenerateNotification() {
        // Given
        String senderId = "user1";
        String recipientId = "user2";
        ChatMessageRequest request = new ChatMessageRequest(recipientId, "Hello", new ArrayList<>());

        Conversation conversation = new Conversation();
        conversation.setId("conv1");

        User sender = new User();
        sender.setId(senderId);

        Message savedMessage = new Message();
        savedMessage.setId("msg1");

        given(conversationRepository.findPrivateConversation(senderId, recipientId)).willReturn(Optional.of(conversation));
        given(userRepository.getReferenceById(senderId)).willReturn(sender);
        given(messageRepository.save(any(Message.class))).willReturn(savedMessage);

        // When
        Message result = chatService.sendMessage(senderId, request);

        // Then
        assertNotNull(result);
        assertEquals("msg1", result.getId());
        then(messageRepository).should().save(any(Message.class));
        then(notificationService).should().createNotification(recipientId, senderId, NotificationType.NEW_MESSAGE, "msg1");
    }

    @Test
    @DisplayName("Test sending message starting a new conversation")
    public void givenNoConversation_whenSendMessage_thenCreateConversationAndSaveMessage() {
        // Given
        String senderId = "user1";
        String recipientId = "user2";
        ChatMessageRequest request = new ChatMessageRequest(recipientId, "Hello!",new ArrayList<>());

        User sender = new User();
        sender.setId(senderId);
        User recipient = new User();
        recipient.setId(recipientId);

        Conversation newConv = new Conversation();
        newConv.setId("newConv");

        Message savedMessage = new Message();
        savedMessage.setId("msg2");

        given(conversationRepository.findPrivateConversation(senderId, recipientId)).willReturn(Optional.empty());
        given(userRepository.getReferenceById(senderId)).willReturn(sender);
        given(userRepository.getReferenceById(recipientId)).willReturn(recipient);
        given(conversationRepository.save(any(Conversation.class))).willReturn(newConv);
        given(messageRepository.save(any(Message.class))).willReturn(savedMessage);

        // When
        Message result = chatService.sendMessage(senderId, request);

        // Then
        assertNotNull(result);
        then(conversationRepository).should().save(any(Conversation.class));
        then(messageRepository).should().save(any(Message.class));
        then(notificationService).should().createNotification(recipientId, senderId, NotificationType.NEW_MESSAGE, "msg2");
    }
}
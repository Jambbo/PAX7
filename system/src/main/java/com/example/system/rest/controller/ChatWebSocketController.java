package com.example.system.rest.controller;

import com.example.system.domain.model.chat.Message;
import com.example.system.rest.dto.chat.AttachmentDto;
import com.example.system.rest.dto.chat.ChatMessageRequest;
import com.example.system.rest.dto.chat.ChatMessageResponse;
import com.example.system.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void send(
            @Payload ChatMessageRequest request,
            Principal principal
            ){
        String senderId = principal.getName();
        Message message = chatService.sendMessage(senderId,request);
        ChatMessageResponse dto = new ChatMessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getContent(),
                message.getStatus(),
                message.getCreatedAt(),
                message.getAttachments() == null ? List.of() :
                        message.getAttachments()
                                .stream()
                                .map(a -> new AttachmentDto(
                                        a.getFileUrl(),
                                        a.getFileName(),
                                        a.getContentType(),
                                        a.getFileSize()
                                ))
                                .toList()
        );

        // recipient
        messagingTemplate.convertAndSendToUser(
                request.recipientId(),
                "/queue/messages",
                dto
        );

        // sender
        messagingTemplate.convertAndSendToUser(
                senderId,
                "/queue/messages",
                dto
        );
    }

    @MessageMapping("/whoami")
    @SendToUser("/queue/test")
    public String whoami(@AuthenticationPrincipal Jwt jwt) {
        return jwt.getSubject();
    }

    @MessageMapping("/echo")
    @SendToUser("/queue/messages")
    public String echo(String msg) {
        return msg;
    }

}

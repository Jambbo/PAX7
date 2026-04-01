package com.example.system.rest.controller;

import com.example.system.domain.model.chat.Message;
import com.example.system.repository.MessageRepository;
import com.example.system.service.chat.ChatService;
import com.example.system.domain.model.chat.Conversation;
import com.example.system.rest.dto.chat.ChatMessageResponse;
import com.example.system.rest.dto.chat.ConversationReadResponseDto;
import com.example.system.rest.dto.mapper.ConversationMapper;
import com.example.system.rest.dto.mapper.MessageMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final MessageRepository messageRepository;
    private final ChatService chatService;
    private final ConversationMapper conversationMapper;
    private final MessageMapper messageMapper;

    @GetMapping("/conversations")
    public List<ConversationReadResponseDto> getConversations(@AuthenticationPrincipal Jwt jwt) {
        List<Conversation> conversations = chatService.getUserConversations(jwt.getSubject());
        return conversationMapper.toDto(conversations);
    }

    @GetMapping("/{conversationId}")
    public Page<ChatMessageResponse> getMessages(
            @PathVariable String conversationId,
            @RequestParam int page,
            @RequestParam int size
    ) {
        Page<Message> messages = messageRepository.findByConversationIdAndDeletedFalse(
                conversationId,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return messages.map(messageMapper::toDto);
    }
}
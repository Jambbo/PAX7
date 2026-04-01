package com.example.system.rest.dto.chat;

import com.example.system.domain.model.chat.MessageStatus;

import java.time.LocalDateTime;
import java.util.List;

public record ChatMessageResponse(
        String id,
        String conversationId,
        String senderId,
        String content,
        MessageStatus status,
        LocalDateTime createdAt,
        List<AttachmentDto> attachments
) {}
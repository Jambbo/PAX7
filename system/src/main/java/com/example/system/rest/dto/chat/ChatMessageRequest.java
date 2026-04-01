package com.example.system.rest.dto.chat;

import java.util.List;

public record ChatMessageRequest(
        String recipientId,
        String content,
        List<AttachmentDto> attachments
) {}
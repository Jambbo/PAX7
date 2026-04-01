package com.example.system.rest.dto.chat;

public record AttachmentDto(
        String fileUrl,
        String fileName,
        String contentType,
        long fileSize
) {}
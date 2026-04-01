package com.example.system.rest.dto.mapper;

import com.example.system.domain.model.chat.Message;
import com.example.system.domain.model.chat.MessageAttachment;
import com.example.system.rest.dto.chat.AttachmentDto;
import com.example.system.rest.dto.chat.ChatMessageResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface MessageMapper {

    @Mapping(target = "conversationId", source = "conversation.id")
    @Mapping(target = "senderId", source = "sender.id")
    ChatMessageResponse toDto(Message message);

    AttachmentDto toDto(MessageAttachment attachment);
}


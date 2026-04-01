package com.example.system.rest.dto.mapper;

import com.example.system.domain.model.chat.Conversation;
import com.example.system.rest.dto.chat.ConversationReadResponseDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {UserMapper.class},
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface ConversationMapper {

    @Mapping(target = "isGroup", source = "group")
    ConversationReadResponseDto toDto(Conversation conversation);

    List<ConversationReadResponseDto> toDto(List<Conversation> conversations);
}

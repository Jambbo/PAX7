package com.example.system.rest.dto.mapper;

import com.example.system.domain.model.notification.Notification;
import com.example.system.rest.dto.notification.NotificationReadResponseDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface NotificationMapper {
    NotificationReadResponseDto toReadResponseDto(Notification notification);
}
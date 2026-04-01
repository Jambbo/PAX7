
package com.example.system.rest.dto.notification;

import com.example.system.domain.model.notification.NotificationStatus;
import com.example.system.domain.model.notification.NotificationType;
import com.example.system.rest.dto.user.UserReadResponseDto;
import lombok.Data;

import java.time.LocalDateTime;


@Data
public class NotificationReadResponseDto {
    private Long id;
    private UserReadResponseDto recipient;
    private UserReadResponseDto sender;
    private NotificationType type;
    private NotificationStatus status;
    private String referenceId;
    private LocalDateTime createdAt;
}
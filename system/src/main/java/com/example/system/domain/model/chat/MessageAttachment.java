package com.example.system.domain.model.chat;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "message_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    Message message;

    String fileUrl;

    String fileName;

    String contentType;

    long fileSize;
}
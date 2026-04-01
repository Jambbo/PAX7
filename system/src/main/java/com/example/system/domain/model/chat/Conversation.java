package com.example.system.domain.model.chat;

import com.example.system.domain.model.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    boolean isGroup;

    String title;

    @ManyToMany
    @JoinTable(
            name = "conversation_members",
            joinColumns = @JoinColumn(name = "conversation_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    Set<User> members = new HashSet<>();

    LocalDateTime createdAt;

    boolean deleted;
}
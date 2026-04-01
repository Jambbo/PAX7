package com.example.system.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode
public class CommentLikeId implements Serializable {
    @Column(name = "comment_id")
    private Long commentId;

    @Column(name = "user_id")
    private String userId;
}


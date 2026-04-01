package com.example.system.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Table(name = "users")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {

    @Id
    @Column(length = 36)
    String id; // Keycloak user id (sub)

    @Column(unique = true, nullable = false, length = 50)
    String username;

    @Email
    @Column(unique = true)
    String email;

    String firstName;
    String lastName;
    String bio;
//    String profilePictureUrl;

    @Enumerated(EnumType.STRING)
    UserStatus status;

    @ColumnDefault("false")
    boolean isProfilePrivate;

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;

    @ManyToMany(mappedBy = "members")
    Set<Group> groups = new HashSet<>();

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    Set<Group> ownedGroups = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "user_friends",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "friend_id")
    )
    Set<User> friends = new HashSet<>();

    @Column(name = "role")
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "users_roles")
    @Enumerated(value = EnumType.STRING)
    Set<Role> roles = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "users_bookmarks",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "post_id")
    )
    Set<Post> bookmarks = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "users_likedposts",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "post_id")
    )
    Set<Post> likedPosts = new HashSet<>();

}

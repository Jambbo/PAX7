package com.example.system.utils;

import com.example.system.domain.model.User;
import com.example.system.domain.model.UserStatus;
import java.util.UUID;

public class UserUtils {

    public static User getJohnDoe() {
        return User.builder()
                .id(UUID.randomUUID().toString())
                .username("johndoe")
                .email("johndoe@example.com")
                .firstName("John")
                .lastName("Doe")
                .bio("I am John Doe")
                .status(UserStatus.ONLINE)
                .isProfilePrivate(false)
                .build();
    }

    public static User getJaneDoe() {
        return User.builder()
                .id(UUID.randomUUID().toString())
                .username("janedoe")
                .email("janedoe@example.com")
                .firstName("Jane")
                .lastName("Doe")
                .bio("I am Jane Doe")
                .status(UserStatus.OFFLINE)
                .isProfilePrivate(true)
                .build();
    }

    public static User getAdminUser() {
        return User.builder()
                .id(UUID.randomUUID().toString())
                .username("admin")
                .email("admin@example.com")
                .firstName("Admin")
                .lastName("User")
                .bio("I am the admin")
                .status(UserStatus.ONLINE)
                .isProfilePrivate(false)
                .build();
    }


}

package com.example.system.service.currentUser;

import com.example.system.domain.model.User;
import com.example.system.domain.model.UserStatus;
import com.example.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @Transactional
    public User getOrCreateUser(Jwt jwt) {
        String userId = jwt.getSubject();

        User existing = userRepository.findById(userId).orElse(null);
        if (existing != null) {
            return existing;
        }

        try {
            return createUserFromJwt(jwt);
        } catch (DataIntegrityViolationException e) {
            return userRepository.findById(userId).orElseThrow();
        }
    }

    private User createUserFromJwt(Jwt jwt) {
        User user = User.builder()
                .id(jwt.getSubject())
                .username(jwt.getClaimAsString("preferred_username"))
                .email(jwt.getClaimAsString("email"))
                .firstName(jwt.getClaimAsString("given_name"))
                .lastName(jwt.getClaimAsString("family_name"))
                .status(UserStatus.ONLINE)
                .isProfilePrivate(false)
                .build();
        return userRepository.save(user);
    }

}
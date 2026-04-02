package com.example.system.service;

import com.example.system.domain.model.User;
import com.example.system.repository.UserRepository;
import com.example.system.service.currentUser.CurrentUserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
public class CurrentUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CurrentUserService currentUserService;

    @Test
    @DisplayName("Test getting current user ID")
    public void givenSecurityContext_whenGetCurrentUserId_thenReturnId() {
        // Given
        String expectedUserId = "user123";
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        given(securityContext.getAuthentication()).willReturn(authentication);
        given(authentication.getName()).willReturn(expectedUserId);
        SecurityContextHolder.setContext(securityContext);

        // When
        String result = currentUserService.getCurrentUserId();

        // Then
        assertEquals(expectedUserId, result);
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Test get existing user")
    public void givenExistingUser_whenGetOrCreateUser_thenReturnExistingUser() {
        // Given
        String userId = "user1";
        Jwt jwt = mock(Jwt.class);
        given(jwt.getSubject()).willReturn(userId);

        User existingUser = new User();
        existingUser.setId(userId);
        given(userRepository.findById(userId)).willReturn(Optional.of(existingUser));

        // When
        User result = currentUserService.getOrCreateUser(jwt);

        // Then
        assertEquals(userId, result.getId());
        then(userRepository).shouldHaveNoMoreInteractions();
    }

    @Test
    @DisplayName("Test create new user")
    public void givenNewUser_whenGetOrCreateUser_thenCreateAndReturnUser() {
        // Given
        String userId = "user2";
        Jwt jwt = mock(Jwt.class);
        given(jwt.getSubject()).willReturn(userId);
        given(jwt.getClaimAsString("preferred_username")).willReturn("john_doe");
        given(jwt.getClaimAsString("email")).willReturn("john@example.com");
        given(jwt.getClaimAsString("given_name")).willReturn("John");
        given(jwt.getClaimAsString("family_name")).willReturn("Doe");

        given(userRepository.findById(userId)).willReturn(Optional.empty());

        User savedUser = new User();
        savedUser.setId(userId);
        savedUser.setUsername("john_doe");
        given(userRepository.save(any(User.class))).willReturn(savedUser);

        // When
        User result = currentUserService.getOrCreateUser(jwt);

        // Then
        assertNotNull(result);
        assertEquals(userId, result.getId());
        assertEquals("john_doe", result.getUsername());
        then(userRepository).should().save(any(User.class));
    }

    @Test
    @DisplayName("Test create user with data integrity violation")
    public void givenConcurrentCreation_whenGetOrCreateUser_thenFetchAndReturnUser() {
        // Given
        String userId = "user3";
        Jwt jwt = mock(Jwt.class);
        given(jwt.getSubject()).willReturn(userId);
        given(jwt.getClaimAsString("preferred_username")).willReturn("jane_doe");
        given(jwt.getClaimAsString("email")).willReturn("jane@example.com");
        given(jwt.getClaimAsString("given_name")).willReturn("Jane");
        given(jwt.getClaimAsString("family_name")).willReturn("Doe");

        given(userRepository.findById(userId))
                .willReturn(Optional.empty())
                .willReturn(Optional.of(new User() {{ setId(userId); }}));

        given(userRepository.save(any(User.class))).willThrow(new DataIntegrityViolationException("Duplicate"));

        // When
        User result = currentUserService.getOrCreateUser(jwt);

        // Then
        assertNotNull(result);
        assertEquals(userId, result.getId());
    }
}
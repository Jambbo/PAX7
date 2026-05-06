package com.example.system.rest;

import com.example.system.rest.security.UserAuthorizationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

public class UserAuthorizationServiceTest {

    private final UserAuthorizationService authorizationService = new UserAuthorizationService();

    @AfterEach
    public void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private void setJwtAuthentication(String userId, Collection<GrantedAuthority> authorities) {
        Jwt jwt = mock(Jwt.class);
        given(jwt.getSubject()).willReturn(userId);
        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Test isAdmin returns true when user has ROLE_ADMIN")
    public void givenUserWithAdminRole_whenIsAdmin_thenReturnTrue() {
        // Given
        setJwtAuthentication("adminUser", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        // When & Then
        assertTrue(authorizationService.isAdmin());
    }

    @Test
    @DisplayName("Test isAdmin returns false when user lacks ROLE_ADMIN")
    public void givenUserWithoutAdminRole_whenIsAdmin_thenReturnFalse() {
        // Given
        setJwtAuthentication("regularUser", List.of(new SimpleGrantedAuthority("ROLE_USER")));

        // When & Then
        assertFalse(authorizationService.isAdmin());
    }

    @Test
    @DisplayName("Test isAdmin returns false when no authentication in context")
    public void givenNoAuthentication_whenIsAdmin_thenReturnFalse() {
        // Given - context cleared by @AfterEach, no auth set

        // When & Then
        assertFalse(authorizationService.isAdmin());
    }

    @Test
    @DisplayName("Test getCurrentUserId returns subject from JWT token")
    public void givenJwtAuthentication_whenGetCurrentUserId_thenReturnSubject() {
        // Given
        setJwtAuthentication("user123", List.of());

        // When
        String result = authorizationService.getCurrentUserId();

        // Then
        assertEquals("user123", result);
    }

    @Test
    @DisplayName("Test getCurrentUserId returns null when authentication is not JWT")
    public void givenNonJwtAuthentication_whenGetCurrentUserId_thenReturnNull() {
        // Given
        Authentication auth = mock(Authentication.class);
        SecurityContextHolder.getContext().setAuthentication(auth);

        // When & Then
        assertNull(authorizationService.getCurrentUserId());
    }
}

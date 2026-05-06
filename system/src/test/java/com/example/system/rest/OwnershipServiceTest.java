package com.example.system.rest;

import com.example.system.repository.CommentRepository;
import com.example.system.repository.GroupRepository;
import com.example.system.repository.PostRepository;
import com.example.system.rest.security.OwnershipService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
public class OwnershipServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private CommentRepository commentRepository;

    @InjectMocks
    private OwnershipService ownershipService;

    @AfterEach
    public void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private void setJwtAuthentication(String userId) {
        Jwt jwt = mock(Jwt.class);
        given(jwt.getSubject()).willReturn(userId);
        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Test isOwner returns true when user owns the post")
    public void givenPostOwnedByCurrentUser_whenIsOwner_thenReturnTrue() {
        // Given
        String userId = "user1";
        Long postId = 1L;
        setJwtAuthentication(userId);
        given(postRepository.existsByIdAndAuthorId(postId, userId)).willReturn(true);

        // When & Then
        assertTrue(ownershipService.isOwner(postId));
    }

    @Test
    @DisplayName("Test isOwner returns false when user does not own the post")
    public void givenPostNotOwnedByCurrentUser_whenIsOwner_thenReturnFalse() {
        // Given
        String userId = "user1";
        Long postId = 1L;
        setJwtAuthentication(userId);
        given(postRepository.existsByIdAndAuthorId(postId, userId)).willReturn(false);

        // When & Then
        assertFalse(ownershipService.isOwner(postId));
    }

    @Test
    @DisplayName("Test isPostGroupOwner returns true when user owns the group of the post")
    public void givenCurrentUserIsPostGroupOwner_whenIsPostGroupOwner_thenReturnTrue() {
        // Given
        String userId = "user1";
        Long postId = 2L;
        setJwtAuthentication(userId);
        given(postRepository.existsByIdAndGroupOwnerId(postId, userId)).willReturn(true);

        // When & Then
        assertTrue(ownershipService.isPostGroupOwner(postId));
    }

    @Test
    @DisplayName("Test isGroupOwner returns true when user owns the group")
    public void givenCurrentUserIsGroupOwner_whenIsGroupOwner_thenReturnTrue() {
        // Given
        String userId = "user1";
        Long groupId = 3L;
        setJwtAuthentication(userId);
        given(groupRepository.existsByIdAndOwnerId(groupId, userId)).willReturn(true);

        // When & Then
        assertTrue(ownershipService.isGroupOwner(groupId));
    }

    @Test
    @DisplayName("Test isCommentOwner returns true when user owns the comment")
    public void givenCurrentUserIsCommentOwner_whenIsCommentOwner_thenReturnTrue() {
        // Given
        String userId = "user1";
        Long commentId = 4L;
        setJwtAuthentication(userId);
        given(commentRepository.existsByIdAndAuthorId(commentId, userId)).willReturn(true);

        // When & Then
        assertTrue(ownershipService.isCommentOwner(commentId));
    }

    @Test
    @DisplayName("Test getCurrentUserId returns null when authentication is not JWT")
    public void givenNonJwtAuthentication_whenGetCurrentUserId_thenReturnNull() {
        // Given
        Authentication auth = mock(Authentication.class);
        SecurityContextHolder.getContext().setAuthentication(auth);

        // When & Then
        assertNull(ownershipService.getCurrentUserId());
    }
}

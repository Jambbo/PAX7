package com.example.system.service;

import com.example.system.domain.model.User;
import com.example.system.repository.UserRepository;
import com.example.system.repository.PostRepository;
import com.example.system.rest.dto.mapper.UserMapper;
import com.example.system.rest.dto.user.UserWriteDto;
import com.example.system.service.user.UserServiceImpl;
import com.example.system.utils.UserUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.BDDMockito;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.List;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.verify;

import com.example.system.domain.model.Post;
import com.example.system.domain.model.UserStatus;

@ExtendWith(MockitoExtension.class)
public class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private PostRepository postRepository;

    @InjectMocks
    private UserServiceImpl serviceUnderTest;

    @Test
    @DisplayName("Test get user by id functionality")
    public void givenUserId_whenGetUserById_thenReturnUser() {
        User user = UserUtils.getJohnDoe();
        BDDMockito.given(userRepository.findById(user.getId())).willReturn(Optional.of(user));

        User result = serviceUnderTest.getUserById(user.getId());

        assertEquals(user.getId(), result.getId());
    }

    @Test
    @DisplayName("Test update user functionality")
    public void givenUserToUpdate_whenUpdateUser_thenRepositoryIsCalled() {
        //given
        User existingUser = UserUtils.getJaneDoe();
        UserWriteDto dto = new UserWriteDto(existingUser.getUsername(), existingUser.getEmail(), existingUser.getFirstName(), existingUser.getLastName(), existingUser.getBio(), existingUser.getStatus(), existingUser.isProfilePrivate());

        BDDMockito.given(userRepository.findById(existingUser.getId())).willReturn(Optional.of(existingUser));
        BDDMockito.given(userRepository.save(any(User.class))).willReturn(existingUser);

        //when
        User savedUser = serviceUnderTest.update(existingUser.getId(), dto);

        //then
        verify(userMapper).updateEntityFromDto(dto, existingUser);
        verify(userRepository).save(existingUser);
        assertEquals(existingUser.getId(), savedUser.getId());
    }

    @Test
    @DisplayName("Test find by username functionality")
    public void givenUsername_whenGetByUsername_thenReturnUser() {
        User user = UserUtils.getAdminUser();
        BDDMockito.given(userRepository.findByUsername(user.getUsername())).willReturn(Optional.of(user));

        User result = serviceUnderTest.getByUsername(user.getUsername());

        assertEquals(user.getUsername(), result.getUsername());
    }

    @Test
    @DisplayName("Test delete user functionality")
    public void givenUserId_whenDeleteUser_thenRepositoryDeleteIsCalled() {
        User user = UserUtils.getJohnDoe();
        BDDMockito.given(userRepository.findById(user.getId())).willReturn(Optional.of(user));

        serviceUnderTest.deleteUser(user.getId());

        verify(userRepository).delete(user);
    }

    @Test
    @DisplayName("Test get all users functionality")
    public void givenUsers_whenFindAll_thenReturnList() {
        List<User> users = List.of(UserUtils.getJohnDoe(), UserUtils.getJaneDoe());
        given(userRepository.findAll()).willReturn(users);

        List<User> result = serviceUnderTest.findAll();

        assertEquals(2, result.size());
        then(userRepository).should().findAll();
    }

    @Test
    @DisplayName("Test checking if user exists by username")
    public void givenUsername_whenExistsByUsername_thenReturnBoolean() {
        String username = "testuser";
        given(userRepository.existsByUsername(username)).willReturn(true);

        boolean result = serviceUnderTest.existsByUsername(username);

        assertTrue(result);
    }

    @Test
    @DisplayName("Test update user status")
    public void givenUserIdAndStatus_whenUpdateStatus_thenStatusIsUpdated() {
        User user = UserUtils.getJohnDoe();
        user.setStatus(UserStatus.OFFLINE);
        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));
        given(userRepository.save(user)).willReturn(user);

        User result = serviceUnderTest.updateStatus(user.getId(), UserStatus.ONLINE);

        assertEquals(UserStatus.ONLINE, result.getStatus());
        then(userRepository).should().save(user);
    }

    @Test
    @DisplayName("Test toggle profile privacy")
    public void givenUserId_whenToggleProfilePrivacy_thenPrivacyIsToggled() {
        User user = UserUtils.getJohnDoe();
        user.setProfilePrivate(false);
        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));
        given(userRepository.save(user)).willReturn(user);

        User result = serviceUnderTest.toggleProfilePrivacy(user.getId());

        assertTrue(result.isProfilePrivate());
        then(userRepository).should().save(user);
    }

    @Test
    @DisplayName("Test add bookmark")
    public void givenUserIdAndPostId_whenAddBookmark_thenPostIsAddedToBookmarks() {
        User user = UserUtils.getJohnDoe();
        user.setBookmarks(new HashSet<>());
        Post post = new Post();
        post.setId(1L);

        given(userRepository.findById(user.getId())).willReturn(Optional.of(user));
        given(postRepository.findById(1L)).willReturn(Optional.of(post));
        given(userRepository.save(user)).willReturn(user);

        User result = serviceUnderTest.addBookmark(user.getId(), 1L);

        assertTrue(result.getBookmarks().contains(post));
        then(userRepository).should().save(user);
    }
}
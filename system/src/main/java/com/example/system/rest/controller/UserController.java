package com.example.system.rest.controller;

import com.example.system.domain.model.Post;
import com.example.system.domain.model.User;
import com.example.system.domain.model.UserStatus;
import com.example.system.rest.dto.mapper.PostMapper;
import com.example.system.rest.dto.mapper.UserMapper;
import com.example.system.rest.dto.post.PostReadResponseDto;
import com.example.system.rest.dto.user.UserReadResponseDto;
import com.example.system.rest.dto.user.UserWriteDto;
import com.example.system.rest.validation.OnUpdate;
import com.example.system.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.parameters.P;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final PostMapper postMapper;

    @GetMapping("/{id}")
    public ResponseEntity<UserReadResponseDto> getById(@PathVariable("id") final String userId) {
        UserReadResponseDto dto = userMapper.toDto(userService.getUserById(userId));
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/count")
    public ResponseEntity<Long> countUsers() {
        Long usersCount = userService.getUsersCount();
        return ResponseEntity.ok(usersCount);
    }

    @GetMapping
    public ResponseEntity<List<UserReadResponseDto>> getAll() {
        List<UserReadResponseDto> dto = userMapper.toDto(userService.findAll());
        return ResponseEntity.ok(dto);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/likedPosts")
    public ResponseEntity<List<PostReadResponseDto>> getMyLikedPosts(
            @AuthenticationPrincipal Jwt jwt
    ) {
        List<Post> likedPostsByUserId = userService.getLikedPostsByUserId(jwt.getSubject());
        List<PostReadResponseDto> likedPostsDto = postMapper.toDto(likedPostsByUserId);
        return ResponseEntity.ok(likedPostsDto);
    }

    @GetMapping("/{userId}/likedPosts")
    public ResponseEntity<List<PostReadResponseDto>> getLikedPostsByUserId(@PathVariable("userId") String userId){
        List<Post> likedPostsByUserId = userService.getLikedPostsByUserId(userId);
        List<PostReadResponseDto> likedPostsDto = postMapper.toDto(likedPostsByUserId);
        return ResponseEntity.ok(likedPostsDto);
    }

    @PreAuthorize("isAuthenticated() and #jwt.subject == #userId")
    @PutMapping("/{id}")
    public ResponseEntity<UserReadResponseDto> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("id") final String userId,
            @Validated(OnUpdate.class) @RequestBody UserWriteDto userWriteDto
    ) {
        User updatedUser = userService.update(userId, userWriteDto);
        return ResponseEntity.ok(userMapper.toDto(updatedUser));
    }

    @PreAuthorize("@userAuth.isAdmin()")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") final String userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<UserReadResponseDto> getByUsername(@PathVariable("username") final String username) {
        UserReadResponseDto dto = userMapper.toDto(userService.getByUsername(username));
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/check-username/{username}")
    public ResponseEntity<Map<String, Boolean>> checkUsernameAvailability(@PathVariable("username") final String username) {
        boolean exists = userService.existsByUsername(username);
        return ResponseEntity.ok(Map.of(
                "exists", exists,
                "available", !exists
        ));
    }

    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/me/status")
    public ResponseEntity<UserReadResponseDto> updateMyStatus(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> statusUpdate
    ) {
        UserStatus status = UserStatus.valueOf(statusUpdate.get("status"));
        User user = userService.updateStatus(jwt.getSubject(), status);
        UserReadResponseDto dto = userMapper.toDto(user);
        return ResponseEntity.ok(dto);
    }

    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/me/profile-privacy")
    public User toggleMyPrivacy(@AuthenticationPrincipal Jwt jwt) {
        return userService.toggleProfilePrivacy(jwt.getSubject());
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/search")
    public ResponseEntity<List<UserReadResponseDto>> search(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam String username
    ) {
        List<UserReadResponseDto> searchedUsers = userMapper.toDto(
                userService.search(username, jwt.getSubject()));
        return ResponseEntity.ok(searchedUsers);
    }

    @GetMapping("/latest")
    public ResponseEntity<List<UserReadResponseDto>> getLatestUsers(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "5") int limit
    ) {
        List<User> users = userService.findLatestUsers(limit)
                .stream()
                .filter(u -> !u.getId().equals(jwt.getSubject()))
                .toList();

        return ResponseEntity.ok(userMapper.toDto(users));
    }
}
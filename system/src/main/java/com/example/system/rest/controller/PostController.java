package com.example.system.rest.controller;

import com.example.system.domain.model.Post;
import com.example.system.rest.dto.mapper.PostMapper;
import com.example.system.rest.dto.post.PostReadResponseDto;
import com.example.system.rest.dto.post.PostWriteDto;
import com.example.system.rest.validation.OnCreate;
import com.example.system.rest.validation.OnUpdate;
import com.example.system.service.post.PostService;
import com.example.system.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final UserService userService;
    private final PostMapper postMapper;

    @PostMapping
    public ResponseEntity<PostReadResponseDto> create(
            @Validated(OnCreate.class) @RequestBody PostWriteDto postWriteDto,
            @AuthenticationPrincipal Jwt jwt) {
        Post post = postMapper.toEntity(postWriteDto);
        PostReadResponseDto dto = postMapper.toDto(postService.createPost(post,jwt.getSubject()));
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostReadResponseDto> getById(@PathVariable Long id) {
        Post post = postService.getPostById(id);
        PostReadResponseDto dto = postMapper.toDto(post);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/all")
    public ResponseEntity<List<PostReadResponseDto>> getAll() {
        List<Post> posts = postService.getAllPosts();
        List<PostReadResponseDto> dtos = postMapper.toDto(posts);
        return ResponseEntity.ok(dtos);
    }

    @PreAuthorize("@ownership.isOwner(#postId)")
    @PutMapping("/{postId}")
    public ResponseEntity<PostReadResponseDto> update(
            @PathVariable Long postId,
            @Validated(OnUpdate.class) @RequestBody PostWriteDto postWriteDto) {
        Post post = postMapper.toEntity(postWriteDto);
        PostReadResponseDto dto = postMapper.toDto(postService.updatePost(postId, post));
        return ResponseEntity.ok(dto);
    }

    @PreAuthorize("@ownership.isOwner(#postId) or @ownership.isPostGroupOwner(#postId) or hasRole('ADMIN')")
    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> delete(@PathVariable Long postId) {
        postService.deletePost(postId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<PostReadResponseDto>> getByAuthor(@PathVariable String authorId) {
        List<Post> posts = postService.getPostsByAuthorId(authorId);
        List<PostReadResponseDto> dtos = postMapper.toDto(posts);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<PostReadResponseDto>> getByGroup(@PathVariable Long groupId) {
        List<Post> posts = postService.getPostsByGroupId(groupId);
        List<PostReadResponseDto> dtos = postMapper.toDto(posts);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/trending/views")
    public ResponseEntity<List<PostReadResponseDto>> getTrendingByViews() {
        List<Post> posts = postService.getTopPostsByViews();
        List<PostReadResponseDto> dtos = postMapper.toDto(posts);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/trending/likes")
    public ResponseEntity<List<PostReadResponseDto>> getTrendingByLikes() {
        List<Post> posts = postService.getTopPostsByLikes();
        List<PostReadResponseDto> dtos = postMapper.toDto(posts);
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<PostReadResponseDto> incrementViews(@PathVariable Long id) {
        Post post = postService.incrementViews(id);
        PostReadResponseDto dto = postMapper.toDto(post);
        return ResponseEntity.ok(dto);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{postId}/like")
    public ResponseEntity<PostReadResponseDto> like(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long postId
    ) {
        Post post = postService.incrementLikesAndAddToUser(postId,jwt.getSubject());
        PostReadResponseDto dto = postMapper.toDto(post);
        return ResponseEntity.ok(dto);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{id}/bookmark")
    public ResponseEntity<Void> addBookmark(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        userService.addBookmark(jwt.getSubject(), id);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}/bookmark")
    public ResponseEntity<Void> removeBookmark(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        userService.removeBookmark(jwt.getSubject(), id);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/bookmarks")
    public ResponseEntity<List<PostReadResponseDto>> getBookmarks(@AuthenticationPrincipal Jwt jwt) {
        List<Post> posts = userService.getBookmarkedPosts(jwt.getSubject());
        List<PostReadResponseDto> dtos = postMapper.toDto(posts);
        return ResponseEntity.ok(dtos);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}/bookmark/status")
    public ResponseEntity<Boolean> getBookmarkStatus(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        boolean isBookmarked = userService.isBookmarked(jwt.getSubject(), id);
        return ResponseEntity.ok(isBookmarked);
    }
}

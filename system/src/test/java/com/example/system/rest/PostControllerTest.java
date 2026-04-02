package com.example.system.rest;

import com.example.system.domain.model.Post;
import com.example.system.rest.controller.PostController;
import com.example.system.rest.dto.mapper.PostMapper;
import com.example.system.rest.dto.post.PostReadResponseDto;
import com.example.system.rest.dto.post.PostWriteDto;
import com.example.system.service.post.PostService;
import com.example.system.service.user.UserService;
import com.example.system.service.currentUser.CurrentUserService;
import com.example.system.rest.security.UserAuthorizationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.BDDMockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PostController.class)
public class PostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PostService postService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private PostMapper postMapper;

    @MockitoBean
    private CurrentUserService currentUserService;

    @MockitoBean
    private UserAuthorizationService userAuthorizationService;

    @Test
    public void givenPostDto_whenCreate_thenSuccess() throws Exception {
        //given
        PostWriteDto postWriteDto = new PostWriteDto(null, "Test Post", null, null, 1L);
        Post post = new Post();

        BDDMockito.given(postMapper.toEntity(any(PostWriteDto.class))).willReturn(post);
        BDDMockito.given(postService.createPost(any(Post.class), anyString())).willReturn(post);
        BDDMockito.given(postMapper.toDto(any(Post.class))).willReturn(
                new PostReadResponseDto(1L, "Test", 0L, 0L, "userId", "user", 1L, "group", null, null, null, false)
        );

        //when
        ResultActions response = mockMvc.perform(post("/api/v1/posts")
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(postWriteDto)));

        //then
        response.andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.text").value("Test"));
    }

    @Test
    public void givenPostId_whenGetById_thenSuccess() throws Exception {
        //given
        Post post = new Post();
        BDDMockito.given(postService.getPostById(1L)).willReturn(post);
        BDDMockito.given(postMapper.toDto(any(Post.class))).willReturn(
                new PostReadResponseDto(1L, "Test", 0L, 0L, "userId", "user", 1L, "group", null, null, null, false)
        );

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/posts/{id}", 1L)
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.text").value("Test"));
    }

    @Test
    public void whenGetAll_thenReturnsList() throws Exception {
        //given
        BDDMockito.given(postService.getAllPosts()).willReturn(List.of(new Post()));
        BDDMockito.given(postMapper.toDto((List<Post>) any())).willReturn(List.of(
                new PostReadResponseDto(1L, "Test", 0L, 0L, "userId", "user", 1L, "group", null, null, null, false)
        ));

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/posts/all")
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1));
    }

    @Test
    public void givenPostDto_whenUpdate_thenSuccess() throws Exception {
        //given
        PostWriteDto postWriteDto = new PostWriteDto(1L, "Updated Post", null, null, 1L);
        Post post = new Post();

        BDDMockito.given(postMapper.toEntity(any(PostWriteDto.class))).willReturn(post);
        BDDMockito.given(postService.updatePost(anyLong(), any(Post.class))).willReturn(post);
        BDDMockito.given(postMapper.toDto(any(Post.class))).willReturn(
                new PostReadResponseDto(1L, "Test", 0L, 0L, "userId", "user", 1L, "group", null, null, null, false)
        );

        //when
        ResultActions response = mockMvc.perform(put("/api/v1/posts/{postId}", 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(postWriteDto)));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Test"));
    }

    @Test
    public void givenPostId_whenDelete_thenSuccess() throws Exception {
        //given
        BDDMockito.doNothing().when(postService).deletePost(1L);

        //when
        ResultActions response = mockMvc.perform(delete("/api/v1/posts/{postId}", 1L)
                .with(jwt())
                .with(csrf()));

        //then
        response.andExpect(status().isNoContent());
    }

    @Test
    public void givenAuthorId_whenGetByAuthor_thenSuccess() throws Exception {
        //given
        BDDMockito.given(postService.getPostsByAuthorId("authorId")).willReturn(List.of(new Post()));
        BDDMockito.given(postMapper.toDto((List<Post>) any())).willReturn(List.of(
                new PostReadResponseDto(1L, "Test", 0L, 0L, "userId", "user", 1L, "group", null, null, null, false)
        ));

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/posts/author/{authorId}", "authorId")
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1));
    }

    @Test
    public void givenGroupId_whenGetByGroup_thenSuccess() throws Exception {
        //given
        BDDMockito.given(postService.getPostsByGroupId(1L)).willReturn(List.of(new Post()));
        BDDMockito.given(postMapper.toDto((List<Post>) any())).willReturn(List.of(
                new PostReadResponseDto(1L, "Test", 0L, 0L, "userId", "user", 1L, "group", null, null, null, false)
        ));

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/posts/group/{groupId}", 1L)
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1));
    }

    @Test
    public void whenGetTrendingByViews_thenSuccess() throws Exception {
        //given
        BDDMockito.given(postService.getTopPostsByViews()).willReturn(List.of());
        BDDMockito.given(postMapper.toDto((List<Post>) any())).willReturn(List.of());

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/posts/trending/views")
                .with(jwt()));

        //then
        response.andExpect(status().isOk());
    }

    @Test
    public void whenGetTrendingByLikes_thenSuccess() throws Exception {
        //given
        BDDMockito.given(postService.getTopPostsByLikes()).willReturn(List.of());
        BDDMockito.given(postMapper.toDto((List<Post>) any())).willReturn(List.of());

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/posts/trending/likes")
                .with(jwt()));

        //then
        response.andExpect(status().isOk());
    }

    @Test
    public void givenPostId_whenIncrementViews_thenSuccess() throws Exception {
        //given
        Post post = new Post();
        BDDMockito.given(postService.incrementViews(1L)).willReturn(post);
        BDDMockito.given(postMapper.toDto(any(Post.class))).willReturn(
                new PostReadResponseDto(1L, "Test", 1L, 0L, "userId", "user", 1L, "group", null, null, null, false)
        );

        //when
        ResultActions response = mockMvc.perform(post("/api/v1/posts/{id}/view", 1L)
                .with(jwt())
                .with(csrf()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.views").value(1L));
    }

    @Test
    public void givenPostId_whenLike_thenSuccess() throws Exception {
        //given
        Post post = new Post();
        BDDMockito.given(postService.incrementLikesAndAddToUser(anyLong(), anyString())).willReturn(post);
        BDDMockito.given(postMapper.toDto(any(Post.class))).willReturn(
                new PostReadResponseDto(1L, "Test", 0L, 1L, "userId", "user", 1L, "group", null, null, null, false)
        );

        //when
        ResultActions response = mockMvc.perform(post("/api/v1/posts/{postId}/like", 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.likes").value(1L));
    }

    @Test
    public void givenPostId_whenAddBookmark_thenSuccess() throws Exception {
        //given
        BDDMockito.given(userService.addBookmark(anyString(), anyLong())).willReturn(new com.example.system.domain.model.User());

        //when
        ResultActions response = mockMvc.perform(post("/api/v1/posts/{id}/bookmark", 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf()));

        //then
        response.andExpect(status().isOk());
    }

    @Test
    public void givenPostId_whenRemoveBookmark_thenSuccess() throws Exception {
        //given
        BDDMockito.given(userService.removeBookmark(anyString(), anyLong())).willReturn(new com.example.system.domain.model.User());

        //when
        ResultActions response = mockMvc.perform(delete("/api/v1/posts/{id}/bookmark", 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf()));

        //then
        response.andExpect(status().isOk());
    }

    @Test
    public void whenGetBookmarks_thenSuccess() throws Exception {
        //given
        BDDMockito.given(userService.getBookmarkedPosts(anyString())).willReturn(List.of());
        BDDMockito.given(postMapper.toDto((List<Post>) any())).willReturn(List.of());

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/posts/bookmarks")
                .with(jwt().jwt(jwt -> jwt.subject("userId"))));

        //then
        response.andExpect(status().isOk());
    }

    @Test
    public void givenPostId_whenGetBookmarkStatus_thenSuccess() throws Exception {
        //given
        BDDMockito.given(userService.isBookmarked(anyString(), anyLong())).willReturn(true);

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/posts/{id}/bookmark/status", 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId"))));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$").value(true));
    }
}

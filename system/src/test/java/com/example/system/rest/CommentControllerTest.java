package com.example.system.rest;

import com.example.system.domain.model.Comment;
import com.example.system.rest.controller.CommentController;
import com.example.system.rest.dto.comment.CommentReadResponseDto;
import com.example.system.rest.dto.comment.CommentWriteDto;
import com.example.system.rest.dto.mapper.CommentMapper;
import com.example.system.service.comment.CommentService;
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

@WebMvcTest(controllers = CommentController.class)
public class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CommentService commentService;

    @MockitoBean
    private CommentMapper commentMapper;

    @MockitoBean
    private CurrentUserService currentUserService;

    @MockitoBean
    private UserAuthorizationService userAuthorizationService;

    @Test
    public void givenDto_whenAddComment_thenSuccess() throws Exception {
        //given
        CommentWriteDto writeDto = new CommentWriteDto("Test Comment");
        Comment comment = new Comment();
        CommentReadResponseDto responseDto = new CommentReadResponseDto(1L, 1L, "userId", "user", "Test Comment", 0L, 0L, false, null, null);

        BDDMockito.given(commentMapper.toEntity(any(CommentWriteDto.class))).willReturn(comment);
        BDDMockito.given(commentService.addComment(anyLong(), anyString(), any(Comment.class))).willReturn(comment);
        BDDMockito.given(commentMapper.toDto(any(Comment.class))).willReturn(responseDto);

        //when
        ResultActions response = mockMvc.perform(post("/api/v1/posts/{postId}/comments", 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(writeDto)));

        //then
        response.andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.content").value("Test Comment"));
    }

    @Test
    public void givenPostId_whenGetCommentsByPost_thenSuccess() throws Exception {
        //given
        BDDMockito.given(commentService.getCommentsByPostId(1L)).willReturn(List.of(new Comment()));
        CommentReadResponseDto responseDto = new CommentReadResponseDto(1L, 1L, "userId", "user", "Test Comment", 0L, 0L, false, null, null);
        BDDMockito.given(commentMapper.toDto((List<Comment>) any())).willReturn(List.of(responseDto));

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/posts/{postId}/comments", 1L)
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].content").value("Test Comment"));
    }

    @Test
    public void givenDto_whenUpdateComment_thenSuccess() throws Exception {
        //given
        CommentWriteDto writeDto = new CommentWriteDto("Updated Comment");
        Comment comment = new Comment();
        CommentReadResponseDto responseDto = new CommentReadResponseDto(1L, 1L, "userId", "user", "Updated Comment", 0L, 0L, true, null, null);

        BDDMockito.given(commentService.updateComment(anyLong(), anyString(), anyString())).willReturn(comment);
        BDDMockito.given(commentMapper.toDto(any(Comment.class))).willReturn(responseDto);

        //when
        ResultActions response = mockMvc.perform(put("/api/v1/posts/{postId}/comments/{commentId}", 1L, 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(writeDto)));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Updated Comment"));
    }

    @Test
    public void givenIds_whenDeleteComment_thenSuccess() throws Exception {
        //given
        BDDMockito.doNothing().when(commentService).deleteComment(anyLong(), anyString());

        //when
        ResultActions response = mockMvc.perform(delete("/api/v1/posts/{postId}/comments/{commentId}", 1L, 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf()));

        //then
        response.andExpect(status().isNoContent());
    }

    @Test
    public void givenIds_whenLikeComment_thenSuccess() throws Exception {
        //given
        Comment comment = new Comment();
        CommentReadResponseDto responseDto = new CommentReadResponseDto(1L, 1L, "userId", "user", "Test", 1L, 0L, false, null, null);

        BDDMockito.given(commentService.likeComment(anyLong(), anyString())).willReturn(comment);
        BDDMockito.given(commentMapper.toDto(any(Comment.class))).willReturn(responseDto);

        //when
        ResultActions response = mockMvc.perform(post("/api/v1/posts/{postId}/comments/{commentId}/like", 1L, 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.likes").value(1L));
    }

    @Test
    public void givenIds_whenDislikeComment_thenSuccess() throws Exception {
        //given
        Comment comment = new Comment();
        CommentReadResponseDto responseDto = new CommentReadResponseDto(1L, 1L, "userId", "user", "Test", 0L, 1L, false, null, null);

        BDDMockito.given(commentService.dislikeComment(anyLong(), anyString())).willReturn(comment);
        BDDMockito.given(commentMapper.toDto(any(Comment.class))).willReturn(responseDto);

        //when
        ResultActions response = mockMvc.perform(post("/api/v1/posts/{postId}/comments/{commentId}/dislike", 1L, 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.dislikes").value(1L));
    }

    @Test
    public void givenIds_whenRemoveInteraction_thenSuccess() throws Exception {
        //given
        Comment comment = new Comment();
        CommentReadResponseDto responseDto = new CommentReadResponseDto(1L, 1L, "userId", "user", "Test", 0L, 0L, false, null, null);

        BDDMockito.given(commentService.removeLikeOrDislike(anyLong(), anyString())).willReturn(comment);
        BDDMockito.given(commentMapper.toDto(any(Comment.class))).willReturn(responseDto);

        //when
        ResultActions response = mockMvc.perform(delete("/api/v1/posts/{postId}/comments/{commentId}/interaction", 1L, 1L)
                .with(jwt().jwt(jwt -> jwt.subject("userId")))
                .with(csrf()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.likes").value(0L));
    }
}


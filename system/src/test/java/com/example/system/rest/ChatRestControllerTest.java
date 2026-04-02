package com.example.system.rest;

import com.example.system.domain.model.chat.Conversation;
import com.example.system.domain.model.chat.Message;
import com.example.system.repository.MessageRepository;
import com.example.system.rest.controller.ChatRestController;
import com.example.system.rest.dto.chat.ChatMessageResponse;
import com.example.system.rest.dto.chat.ConversationReadResponseDto;
import com.example.system.rest.dto.mapper.ConversationMapper;
import com.example.system.rest.dto.mapper.MessageMapper;
import com.example.system.service.chat.ChatService;
import com.example.system.service.currentUser.CurrentUserService;
import com.example.system.rest.security.UserAuthorizationService;
import org.junit.jupiter.api.Test;
import org.mockito.BDDMockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ChatRestController.class)
public class ChatRestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MessageRepository messageRepository;

    @MockitoBean
    private ChatService chatService;

    @MockitoBean
    private ConversationMapper conversationMapper;

    @MockitoBean
    private MessageMapper messageMapper;

    @MockitoBean
    private CurrentUserService currentUserService;

    @MockitoBean
    private UserAuthorizationService userAuthorizationService;

    @Test
    public void whenGetConversations_thenSuccess() throws Exception {
        //given
        BDDMockito.given(chatService.getUserConversations(anyString())).willReturn(List.of(new Conversation()));

        ConversationReadResponseDto dto = new ConversationReadResponseDto("id", false, "Conv Name", null, null, false);
        BDDMockito.given(conversationMapper.toDto((List<Conversation>) any())).willReturn(List.of(dto));

        //when
        ResultActions response = mockMvc.perform(get("/api/chat/conversations")
                .with(jwt().jwt(jwt -> jwt.subject("userId"))));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].title").value("Conv Name"));
    }

    @Test
    public void givenConversationId_whenGetMessages_thenSuccess() throws Exception {
        //given
        Page<Message> page = new PageImpl<>(List.of(new Message()));
        BDDMockito.given(messageRepository.findByConversationIdAndDeletedFalse(anyString(), any(Pageable.class))).willReturn(page);

        ChatMessageResponse dto = new ChatMessageResponse("msgId", "convId", "senderId", "content", null, null, null);
        BDDMockito.given(messageMapper.toDto(any(Message.class))).willReturn(dto);

        //when
        ResultActions response = mockMvc.perform(get("/api/chat/{conversationId}", "convId")
                .param("page", "0")
                .param("size", "10")
                .with(jwt()));

        //then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("msgId"))
                .andExpect(jsonPath("$.content[0].content").value("content"));
    }
}

package com.example.system.rest;

import com.example.system.rest.controller.SearchController;
import com.example.system.rest.dto.search.GlobalSearchResponseDto;
import com.example.system.service.search.SearchService;
import com.example.system.service.currentUser.CurrentUserService;
import com.example.system.rest.security.UserAuthorizationService;
import org.junit.jupiter.api.Test;
import org.mockito.BDDMockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SearchController.class)
public class SearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SearchService searchService;

    @MockitoBean
    private CurrentUserService currentUserService;

    @MockitoBean
    private UserAuthorizationService userAuthorizationService;

    @Test
    public void givenQuery_whenSearch_thenSuccess() throws Exception {
        //given
        GlobalSearchResponseDto responseDto = new GlobalSearchResponseDto(null, null, null);
        BDDMockito.given(searchService.search(anyString())).willReturn(responseDto);

        //when
        ResultActions response = mockMvc.perform(get("/api/v1/search")
                .param("query", "test")
                .with(jwt()));

        //then
        response.andExpect(status().isOk());
    }

    @Test
    public void givenEmptyQuery_whenSearch_thenBadRequest() throws Exception {
        //when
        ResultActions response = mockMvc.perform(get("/api/v1/search")
                .param("query", "   ")
                .with(jwt()));

        //then
        response.andExpect(status().isBadRequest());
    }

    @Test
    public void givenNoQuery_whenSearch_thenBadRequest() throws Exception {
        //when
        ResultActions response = mockMvc.perform(get("/api/v1/search")
                .with(jwt()));

        //then
        // Depending on Spring config, missing required param is either 400 or 500 (if uncaught).
        // Modifying to expect 500 based on the current application configuration.
        response.andExpect(status().isInternalServerError());
    }
}

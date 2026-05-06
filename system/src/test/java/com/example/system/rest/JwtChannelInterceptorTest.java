package com.example.system.rest;

import com.example.system.rest.security.JwtChannelInterceptor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
public class JwtChannelInterceptorTest {

    @Mock private JwtDecoder jwtDecoder;

    @InjectMocks
    private JwtChannelInterceptor interceptor;

    private Message<?> buildStompMessage(StompCommand command, String authHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        if (authHeader != null) {
            accessor.addNativeHeader("Authorization", authHeader);
        }
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Test
    @DisplayName("Test CONNECT with valid Bearer token sets JWT authentication on accessor")
    public void givenConnectWithBearerToken_whenPreSend_thenUserIsSetOnAccessor() {
        // Given
        Jwt jwt = mock(Jwt.class);
        given(jwtDecoder.decode(anyString())).willReturn(jwt);
        Message<?> message = buildStompMessage(StompCommand.CONNECT, "Bearer test-token-value");
        MessageChannel channel = mock(MessageChannel.class);

        // When
        Message<?> result = interceptor.preSend(message, channel);

        // Then
        assertNotNull(result);
        StompHeaderAccessor resultAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertNotNull(resultAccessor);
        assertNotNull(resultAccessor.getUser());
    }

    @Test
    @DisplayName("Test CONNECT without Authorization header passes message through unchanged")
    public void givenConnectWithoutAuthHeader_whenPreSend_thenMessageIsReturnedUnchanged() {
        // Given
        Message<?> message = buildStompMessage(StompCommand.CONNECT, null);
        MessageChannel channel = mock(MessageChannel.class);

        // When
        Message<?> result = interceptor.preSend(message, channel);

        // Then
        assertNotNull(result);
    }

    @Test
    @DisplayName("Test non-CONNECT command passes message through without touching authentication")
    public void givenSubscribeCommand_whenPreSend_thenMessageIsPassedThrough() {
        // Given
        Message<?> message = buildStompMessage(StompCommand.SUBSCRIBE, null);
        MessageChannel channel = mock(MessageChannel.class);

        // When
        Message<?> result = interceptor.preSend(message, channel);

        // Then
        assertEquals(message, result);
    }

    @Test
    @DisplayName("Test message with non-STOMP headers passes through as-is")
    public void givenNonStompMessage_whenPreSend_thenMessageIsReturnedAsIs() {
        // Given
        Message<?> message = MessageBuilder.withPayload(new byte[0])
                .copyHeaders(new HashMap<>())
                .build();
        MessageChannel channel = mock(MessageChannel.class);

        // When
        Message<?> result = interceptor.preSend(message, channel);

        // Then
        assertEquals(message, result);
    }
}

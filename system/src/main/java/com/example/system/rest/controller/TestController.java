package com.example.system.rest.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestController {

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Object> result = new HashMap<>();
        result.put("userId", jwt.getSubject());
        result.put("email", jwt.getClaims().get("email"));
        result.put("username", jwt.getClaims().get("preferred_username"));
        result.put("claims", jwt.getClaims());
        result.put("token", jwt.getTokenValue());
        return result;
    }


}

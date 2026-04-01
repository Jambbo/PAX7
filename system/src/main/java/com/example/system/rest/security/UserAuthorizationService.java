package com.example.system.rest.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

@Service("userAuth")
public class UserAuthorizationService implements SecurityService {


    public boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext()
                .getAuthentication();

        return auth != null && auth
                .getAuthorities()
                .stream()
                .anyMatch(
                        a ->
                                a.getAuthority().equals("ROLE_ADMIN")
                );
    }


    @Override
    public String getCurrentUserId() {
        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            return jwtAuth.getToken().getSubject();
        }
        return null;
    }
}

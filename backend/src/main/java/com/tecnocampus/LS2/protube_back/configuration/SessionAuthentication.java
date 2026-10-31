package com.tecnocampus.LS2.protube_back.configuration;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SessionAuthentication {
    private final SecurityContextRepository contexts;
    private final SessionAuthenticationStrategy strategy;

    public SessionAuthentication(SecurityContextRepository contexts, SessionAuthenticationStrategy strategy) {
        this.contexts = contexts;
        this.strategy = strategy;
    }

    public void start(Long userId, HttpServletRequest request, HttpServletResponse response) {
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                userId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        strategy.onAuthentication(authentication, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        contexts.saveContext(context, request, response);
        SecurityContextHolder.setContext(context);
    }
}

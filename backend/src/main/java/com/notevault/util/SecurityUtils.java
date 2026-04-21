package com.notevault.util;

import com.notevault.entity.User;
import com.notevault.exception.UnauthorizedException;
import com.notevault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    public User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException();
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElseThrow(UnauthorizedException::new);
    }
}

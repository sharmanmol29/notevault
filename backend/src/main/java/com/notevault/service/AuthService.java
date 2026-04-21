package com.notevault.service;

import com.notevault.dto.request.LoginRequest;
import com.notevault.dto.request.RefreshTokenRequest;
import com.notevault.dto.request.RegisterRequest;
import com.notevault.dto.response.AuthResponse;
import com.notevault.entity.AuthProvider;
import com.notevault.entity.RefreshToken;
import com.notevault.entity.User;
import com.notevault.exception.ResourceNotFoundException;
import com.notevault.exception.UnauthorizedException;
import com.notevault.repository.RefreshTokenRepository;
import com.notevault.repository.UserRepository;
import com.notevault.security.JwtTokenProvider;
import com.notevault.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;
    private final SecurityUtils securityUtils;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiryMs;

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider(AuthProvider.LOCAL)
                .enabled(true)
                .build();
        userRepository.save(user);
        return issueTokens(user, httpRequest);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        auditService.log(user, "LOGIN", "USER", user.getId(), httpRequest.getRemoteAddr());
        return issueTokens(user, httpRequest);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (!jwtTokenProvider.validateToken(token) || !jwtTokenProvider.isRefreshToken(token)) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException("Refresh token expired");
        }
        User user = refreshToken.getUser();
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword() != null ? user.getPassword() : "{noop}")
                .authorities("ROLE_USER")
                .build();

        refreshTokenRepository.delete(refreshToken);

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String newRefresh = jwtTokenProvider.generateRefreshToken(userDetails);
        RefreshToken newEntity = RefreshToken.builder()
                .token(newRefresh)
                .user(user)
                .expiryDate(LocalDateTime.now().plus(Duration.ofMillis(refreshTokenExpiryMs)))
                .build();
        refreshTokenRepository.save(newEntity);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefresh)
                .user(toSummary(user))
                .build();
    }

    @Transactional
    public void logout() {
        User user = securityUtils.currentUser();
        refreshTokenRepository.deleteByUser(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse.UserSummary me() {
        User user = securityUtils.currentUser();
        return toSummary(user);
    }

    private AuthResponse issueTokens(User user, HttpServletRequest httpRequest) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword() != null ? user.getPassword() : "{noop}")
                .authorities("ROLE_USER")
                .build();

        refreshTokenRepository.deleteByUser(user);

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refresh = jwtTokenProvider.generateRefreshToken(userDetails);
        RefreshToken refreshToken = RefreshToken.builder()
                .token(refresh)
                .user(user)
                .expiryDate(LocalDateTime.now().plus(Duration.ofMillis(refreshTokenExpiryMs)))
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refresh)
                .user(toSummary(user))
                .build();
    }

    private AuthResponse.UserSummary toSummary(User user) {
        return AuthResponse.UserSummary.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }
}

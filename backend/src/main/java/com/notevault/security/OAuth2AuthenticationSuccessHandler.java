package com.notevault.security;

import com.notevault.entity.RefreshToken;
import com.notevault.entity.User;
import com.notevault.repository.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiryMs;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        User user;
        if (oauth2User instanceof CustomOAuth2User customOAuth2User) {
            user = customOAuth2User.getUser();
        } else {
            throw new IllegalStateException("Unexpected OAuth2 user type");
        }

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword() != null ? user.getPassword() : "{noop}")
                .authorities("ROLE_USER")
                .build();

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken(userDetails);

        refreshTokenRepository.deleteByUser(user);
        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenValue)
                .user(user)
                .expiryDate(LocalDateTime.now().plus(Duration.ofMillis(refreshTokenExpiryMs)))
                .build();
        refreshTokenRepository.save(refreshToken);

        String target = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/callback")
                .queryParam("token", accessToken)
                .queryParam("refreshToken", refreshTokenValue)
                .build()
                .toUriString();
        getRedirectStrategy().sendRedirect(request, response, target);
    }
}

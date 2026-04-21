package com.notevault.security;

import com.notevault.entity.AuthProvider;
import com.notevault.entity.User;
import com.notevault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class GoogleOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oauth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.getOrDefault("name", email);
        String providerId = String.valueOf(attributes.get("sub"));

        if (email == null) {
            throw new OAuth2AuthenticationException("Email not available from Google");
        }

        User user = userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, providerId)
                .or(() -> userRepository.findByEmail(email))
                .map(existing -> {
                    if (existing.getProvider() != AuthProvider.GOOGLE) {
                        existing.setProvider(AuthProvider.GOOGLE);
                        existing.setProviderId(providerId);
                    }
                    existing.setName(name);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .name(name)
                        .email(email)
                        .password(null)
                        .provider(AuthProvider.GOOGLE)
                        .providerId(providerId)
                        .enabled(true)
                        .build()));

        return new CustomOAuth2User(oauth2User, user);
    }
}

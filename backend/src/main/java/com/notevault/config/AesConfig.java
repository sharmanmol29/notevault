package com.notevault.config;

import com.notevault.util.AesEncryptionUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AesConfig {

    @Bean
    public AesEncryptionUtil aesEncryptionUtil(@Value("${aes.secret}") String aesSecret) {
        return new AesEncryptionUtil(aesSecret);
    }
}

package com.notevault.service;

import com.notevault.util.AesEncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EncryptionService {

    private final AesEncryptionUtil aesEncryptionUtil;

    public String encrypt(String plaintext) {
        return aesEncryptionUtil.encrypt(plaintext);
    }

    public String decrypt(String ciphertext) {
        return aesEncryptionUtil.decrypt(ciphertext);
    }
}

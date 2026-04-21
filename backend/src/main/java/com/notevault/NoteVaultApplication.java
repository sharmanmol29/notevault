package com.notevault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NoteVaultApplication
{

    public static void main(String[] args)
    {
        SpringApplication.run(NoteVaultApplication.class, args);
    }
}

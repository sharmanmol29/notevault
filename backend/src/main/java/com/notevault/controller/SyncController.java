package com.notevault.controller;

import com.notevault.dto.response.SyncResponse;
import com.notevault.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    @GetMapping
    public SyncResponse sync(@RequestParam(value = "since", required = false) String since) {
        return syncService.sync(since);
    }
}

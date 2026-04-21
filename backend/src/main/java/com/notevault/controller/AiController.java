package com.notevault.controller;

import com.notevault.dto.request.AiAskRequest;
import com.notevault.dto.request.AiNoteIdRequest;
import com.notevault.dto.response.AiResponse;
import com.notevault.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/summarize")
    public AiResponse summarize(@Valid @RequestBody AiNoteIdRequest request) {
        return aiService.summarize(request.getNoteId());
    }

    @PostMapping("/generate-tags")
    public AiResponse generateTags(@Valid @RequestBody AiNoteIdRequest request) {
        return aiService.generateTags(request.getNoteId());
    }

    @PostMapping("/improve")
    public AiResponse improve(@Valid @RequestBody AiNoteIdRequest request) {
        return aiService.improve(request.getNoteId());
    }

    @PostMapping("/ask")
    public AiResponse ask(@Valid @RequestBody AiAskRequest request) {
        return aiService.ask(request);
    }
}

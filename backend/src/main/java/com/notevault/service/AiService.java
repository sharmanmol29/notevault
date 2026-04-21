package com.notevault.service;

import com.notevault.dto.request.AiAskRequest;
import com.notevault.dto.response.AiResponse;
import com.notevault.entity.Note;
import com.notevault.entity.User;
import com.notevault.exception.ResourceNotFoundException;
import com.notevault.exception.UnauthorizedException;
import com.notevault.repository.NoteRepository;
import com.notevault.util.SecurityUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiService {

    private final WebClient webClient;
    private final NoteRepository noteRepository;
    private final EncryptionService encryptionService;
    private final SecurityUtils securityUtils;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Transactional(readOnly = true)
    public AiResponse summarize(Long noteId) {
        String body = callGemini("Summarize the following note in concise bullet points:\n\n" + loadDecrypted(noteId));
        return AiResponse.builder().text(body).build();
    }

    @Transactional(readOnly = true)
    public AiResponse generateTags(Long noteId) {
        String prompt = """
                From the following note, return a comma-separated list of 3-8 short topical tags (single words or short phrases). \
                Respond with tags only, separated by commas, no numbering or extra text.

                Note:
                %s
                """.formatted(loadDecrypted(noteId));
        String body = callGemini(prompt);
        List<String> tags = parseTags(body);
        return AiResponse.builder().tags(tags).build();
    }

    @Transactional(readOnly = true)
    public AiResponse improve(Long noteId) {
        String prompt = """
                Improve the writing of the following note while preserving meaning. \
                Return only the improved note text.

                Note:
                %s
                """.formatted(loadDecrypted(noteId));
        String body = callGemini(prompt);
        return AiResponse.builder().text(body).build();
    }

    @Transactional(readOnly = true)
    public AiResponse ask(AiAskRequest request) {
        User user = securityUtils.currentUser();
        StringBuilder context = new StringBuilder();
        for (Long id : request.getNoteIds()) {
            Note note = noteRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
            if (!note.getUser().getId().equals(user.getId()) || note.isDeleted()) {
                throw new UnauthorizedException("Note not accessible");
            }
            String plain = encryptionService.decrypt(note.getEncryptedContent());
            context.append("Title: ").append(note.getTitle()).append("\n")
                    .append(plain).append("\n\n");
        }
        String prompt = """
                Using only the context below, answer the question. If the answer is not in the context, say you cannot find it in the notes.

                Context:
                %s

                Question: %s
                """.formatted(context, request.getQuestion());
        String body = callGemini(prompt);
        return AiResponse.builder().text(body).build();
    }

    private String loadDecrypted(Long noteId) {
        User user = securityUtils.currentUser();
        Note note = noteRepository.findById(noteId).orElseThrow(ResourceNotFoundException::new);
        if (!note.getUser().getId().equals(user.getId()) || note.isDeleted()) {
            throw new UnauthorizedException("Note not accessible");
        }
        return encryptionService.decrypt(note.getEncryptedContent());
    }

    private String callGemini(String prompt) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new IllegalArgumentException("GEMINI_API_KEY is not configured.");
        }
        try {
            URI uri = URI.create(geminiApiUrl + "?key=" + java.net.URLEncoder.encode(geminiApiKey, StandardCharsets.UTF_8));
            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> parts = Map.of("parts", List.of(part));
            Map<String, Object> body = Map.of("contents", List.of(parts));

            String response = webClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(response);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                JsonNode err = root.path("error").path("message");
                if (err.isTextual()) {
                    return "Gemini error: " + err.asText();
                }
                return "Gemini returned no candidates.";
            }
            JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
            if (!textNode.isTextual()) {
                return "Unable to parse Gemini response.";
            }
            return textNode.asText();
        } catch (WebClientResponseException ex) {
            return "Gemini request failed: " + ex.getStatusCode() + " " + ex.getResponseBodyAsString();
        } catch (Exception ex) {
            return "Gemini request failed: " + ex.getMessage();
        }
    }

    private List<String> parseTags(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        String[] parts = raw.split(",");
        List<String> tags = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                tags.add(trimmed);
            }
        }
        return tags.stream().limit(12).collect(Collectors.toList());
    }
}

package com.notevault.service;

import com.notevault.dto.response.NoteResponse;
import com.notevault.dto.response.SyncResponse;
import com.notevault.entity.Note;
import com.notevault.entity.User;
import com.notevault.repository.NoteRepository;
import com.notevault.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SyncService {

    private final NoteRepository noteRepository;
    private final NoteService noteService;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public SyncResponse sync(String since) {
        User user = securityUtils.currentUser();
        Instant sinceInstant = (since == null || since.isBlank())
                ? Instant.EPOCH
                : Instant.parse(since);
        LocalDateTime sinceTime = LocalDateTime.ofInstant(sinceInstant, ZoneOffset.UTC);

        List<Note> updatedNotes = noteRepository.findUpdatedAfter(user, sinceTime);
        List<NoteResponse> updated = updatedNotes.stream().map(noteService::mapToResponse).toList();
        List<Long> deletedIds = noteRepository.findDeletedIdsAfter(user, sinceTime);

        return SyncResponse.builder()
                .updated(updated)
                .deletedIds(deletedIds)
                .serverTime(Instant.now())
                .build();
    }
}

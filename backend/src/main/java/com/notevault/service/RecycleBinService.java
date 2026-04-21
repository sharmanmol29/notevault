package com.notevault.service;

import com.notevault.dto.response.NoteResponse;
import com.notevault.entity.Note;
import com.notevault.entity.User;
import com.notevault.exception.ResourceNotFoundException;
import com.notevault.exception.UnauthorizedException;
import com.notevault.repository.NoteRepository;
import com.notevault.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecycleBinService {

    private final NoteRepository noteRepository;
    private final EncryptionService encryptionService;
    private final SecurityUtils securityUtils;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<NoteResponse> listDeleted() {
        User user = securityUtils.currentUser();
        return noteRepository.findByUserAndDeletedTrueOrderByDeletedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public NoteResponse restore(Long id, HttpServletRequest httpRequest) {
        Note note = loadDeletedOwned(id);
        User user = note.getUser();
        note.setDeleted(false);
        note.setDeletedAt(null);
        noteRepository.save(note);
        auditService.log(user, "RESTORE_NOTE", "NOTE", note.getId(), httpRequest.getRemoteAddr());
        return toResponse(note);
    }

    @Transactional
    public void hardDelete(Long id, HttpServletRequest httpRequest) {
        Note note = loadDeletedOwned(id);
        User user = note.getUser();
        noteRepository.delete(note);
        auditService.log(user, "HARD_DELETE_NOTE", "NOTE", id, httpRequest.getRemoteAddr());
    }

    @Transactional
    public void empty(HttpServletRequest httpRequest) {
        User user = securityUtils.currentUser();
        List<Note> deleted = noteRepository.findByUserAndDeletedTrueOrderByDeletedAtDesc(user);
        noteRepository.deleteAll(deleted);
        auditService.log(user, "EMPTY_RECYCLE_BIN", "NOTE", null, httpRequest.getRemoteAddr());
    }

    @Transactional
    public void purgeExpired(int retentionDays) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        List<Note> expired = noteRepository.findExpiredDeleted(cutoff);
        noteRepository.deleteAll(expired);
    }

    private Note loadDeletedOwned(Long id) {
        User user = securityUtils.currentUser();
        Note note = noteRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        if (!note.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Note not found");
        }
        if (!note.isDeleted()) {
            throw new ResourceNotFoundException("Note not found in recycle bin");
        }
        return note;
    }

    private NoteResponse toResponse(Note note) {
        String content = encryptionService.decrypt(note.getEncryptedContent());
        Long folderId = note.getFolder() != null ? note.getFolder().getId() : null;
        String folderName = note.getFolder() != null ? note.getFolder().getName() : null;
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(content)
                .tags(new ArrayList<>(note.getTags()))
                .folderId(folderId)
                .folderName(folderName)
                .wordCount(note.getWordCount())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .deleted(note.isDeleted())
                .build();
    }
}

package com.notevault.service;

import com.notevault.dto.request.NoteRequest;
import com.notevault.dto.response.NoteResponse;
import com.notevault.entity.Folder;
import com.notevault.entity.Note;
import com.notevault.entity.User;
import com.notevault.exception.ResourceNotFoundException;
import com.notevault.exception.UnauthorizedException;
import com.notevault.repository.FolderRepository;
import com.notevault.repository.NoteRepository;
import com.notevault.util.SecurityUtils;
import com.notevault.util.TextUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final FolderRepository folderRepository;
    private final EncryptionService encryptionService;
    private final SecurityUtils securityUtils;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<NoteResponse> listActive(Long folderId) {
        User user = securityUtils.currentUser();
        List<Note> notes = folderId == null
                ? noteRepository.findByUserAndDeletedFalseOrderByUpdatedAtDesc(user)
                : noteRepository.findByUserAndFolder_IdAndDeletedFalseOrderByUpdatedAtDesc(user, folderId);
        return notes.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public NoteResponse getById(Long id) {
        Note note = loadOwnedNote(id, false);
        return toResponse(note);
    }

    @Transactional
    public NoteResponse create(NoteRequest request, HttpServletRequest httpRequest) {
        User user = securityUtils.currentUser();
        Folder folder = resolveFolder(user, request.getFolderId());
        String content = request.getContent() == null ? "" : request.getContent();
        Note note = Note.builder()
                .title(request.getTitle() != null ? request.getTitle() : "Untitled")
                .encryptedContent(encryptionService.encrypt(content))
                .user(user)
                .folder(folder)
                .deleted(false)
                .wordCount(TextUtils.countWords(content))
                .tags(request.getTags() != null ? new ArrayList<>(request.getTags()) : new ArrayList<>())
                .build();
        noteRepository.save(note);
        auditService.log(user, "CREATE_NOTE", "NOTE", note.getId(), httpRequest.getRemoteAddr());
        return toResponse(note);
    }

    @Transactional
    public NoteResponse update(Long id, NoteRequest request, HttpServletRequest httpRequest) {
        Note note = loadOwnedNote(id, false);
        User user = note.getUser();
        if (request.getTitle() != null) {
            note.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            note.setEncryptedContent(encryptionService.encrypt(request.getContent()));
            note.setWordCount(TextUtils.countWords(request.getContent()));
        }
        if (Boolean.TRUE.equals(request.getMoveToRoot())) {
            note.setFolder(null);
        } else if (request.getFolderId() != null) {
            note.setFolder(resolveFolder(user, request.getFolderId()));
        }
        if (request.getTags() != null) {
            note.setTags(new ArrayList<>(request.getTags()));
        }
        noteRepository.save(note);
        auditService.log(user, "UPDATE_NOTE", "NOTE", note.getId(), httpRequest.getRemoteAddr());
        return toResponse(note);
    }

    @Transactional
    public void softDelete(Long id, HttpServletRequest httpRequest) {
        Note note = loadOwnedNote(id, false);
        User user = note.getUser();
        note.setDeleted(true);
        note.setDeletedAt(LocalDateTime.now());
        noteRepository.save(note);
        auditService.log(user, "DELETE_NOTE", "NOTE", note.getId(), httpRequest.getRemoteAddr());
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> search(String query) {
        User user = securityUtils.currentUser();
        if (query == null || query.isBlank()) {
            return listActive(null);
        }
        String q = query.trim();
        Set<Long> ordered = new LinkedHashSet<>();
        for (Note note : noteRepository.searchByTitle(user, q)) {
            ordered.add(note.getId());
        }
        for (Note note : noteRepository.findByUserAndDeletedFalseOrderByUpdatedAtDesc(user)) {
            String plain = encryptionService.decrypt(note.getEncryptedContent());
            if (plain.toLowerCase().contains(q.toLowerCase())) {
                ordered.add(note.getId());
            }
        }
        List<NoteResponse> results = new ArrayList<>();
        for (Long id : ordered) {
            noteRepository.findById(id).filter(n -> n.getUser().getId().equals(user.getId()) && !n.isDeleted())
                    .ifPresent(n -> results.add(toResponse(n)));
        }
        return results;
    }

    private Folder resolveFolder(User user, Long folderId) {
        if (folderId == null) {
            return null;
        }
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
        if (!folder.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Folder does not belong to user");
        }
        return folder;
    }

    private Note loadOwnedNote(Long id, boolean allowDeleted) {
        User user = securityUtils.currentUser();
        Note note = noteRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        if (!note.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Note not found");
        }
        if (!allowDeleted && note.isDeleted()) {
            throw new ResourceNotFoundException("Note not found");
        }
        return note;
    }

    @Transactional(readOnly = true)
    public NoteResponse mapToResponse(Note note) {
        return toResponse(note);
    }

    private NoteResponse toResponse(Note note) {
        String content = encryptionService.decrypt(note.getEncryptedContent());
        Long folderId = note.getFolder() != null ? note.getFolder().getId() : null;
        String folderName = note.getFolder() != null ? note.getFolder().getName() : null;
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(content)
                .folderId(folderId)
                .folderName(folderName)
                .tags(new ArrayList<>(note.getTags()))
                .wordCount(note.getWordCount())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .deleted(note.isDeleted())
                .build();
    }
}

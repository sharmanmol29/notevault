package com.notevault.service;

import com.notevault.dto.request.FolderRequest;
import com.notevault.dto.response.FolderResponse;
import com.notevault.entity.Folder;
import com.notevault.entity.User;
import com.notevault.exception.ResourceNotFoundException;
import com.notevault.exception.UnauthorizedException;
import com.notevault.repository.FolderRepository;
import com.notevault.repository.NoteRepository;
import com.notevault.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final NoteRepository noteRepository;
    private final SecurityUtils securityUtils;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<FolderResponse> tree() {
        User user = securityUtils.currentUser();
        List<Folder> all = folderRepository.findByUserOrderByNameAsc(user);
        Map<Long, FolderResponse> nodes = new HashMap<>();
        for (Folder folder : all) {
            long noteCount = noteRepository.countByUserAndFolder_IdAndDeletedFalse(user, folder.getId());
            nodes.put(folder.getId(), FolderResponse.builder()
                    .id(folder.getId())
                    .name(folder.getName())
                    .parentId(folder.getParent() != null ? folder.getParent().getId() : null)
                    .children(new ArrayList<>())
                    .noteCount(noteCount)
                    .createdAt(folder.getCreatedAt())
                    .build());
        }
        List<FolderResponse> roots = new ArrayList<>();
        for (Folder folder : all) {
            FolderResponse node = nodes.get(folder.getId());
            if (folder.getParent() == null) {
                roots.add(node);
            } else {
                FolderResponse parent = nodes.get(folder.getParent().getId());
                if (parent != null) {
                    parent.getChildren().add(node);
                }
            }
        }
        sortChildren(roots);
        return roots;
    }

    private void sortChildren(List<FolderResponse> nodes) {
        nodes.sort(Comparator.comparing(FolderResponse::getName, String.CASE_INSENSITIVE_ORDER));
        for (FolderResponse node : nodes) {
            sortChildren(node.getChildren());
        }
    }

    @Transactional
    public FolderResponse create(FolderRequest request, HttpServletRequest httpRequest) {
        User user = securityUtils.currentUser();
        Folder parent = null;
        if (request.getParentId() != null) {
            parent = folderRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent folder not found"));
            if (!parent.getUser().getId().equals(user.getId())) {
                throw new UnauthorizedException("Parent folder does not belong to user");
            }
        }
        Folder folder = Folder.builder()
                .name(request.getName())
                .parent(parent)
                .user(user)
                .build();
        folderRepository.save(folder);
        auditService.log(user, "CREATE_FOLDER", "FOLDER", folder.getId(), httpRequest.getRemoteAddr());
        return FolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .parentId(parent != null ? parent.getId() : null)
                .children(new ArrayList<>())
                .noteCount(0)
                .createdAt(folder.getCreatedAt())
                .build();
    }

    @Transactional
    public FolderResponse rename(Long id, FolderRequest request, HttpServletRequest httpRequest) {
        Folder folder = loadOwned(id);
        User user = folder.getUser();
        folder.setName(request.getName());
        folderRepository.save(folder);
        auditService.log(user, "UPDATE_FOLDER", "FOLDER", folder.getId(), httpRequest.getRemoteAddr());
        long noteCount = noteRepository.countByUserAndFolder_IdAndDeletedFalse(user, folder.getId());
        return FolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .parentId(folder.getParent() != null ? folder.getParent().getId() : null)
                .children(new ArrayList<>())
                .noteCount(noteCount)
                .createdAt(folder.getCreatedAt())
                .build();
    }

    @Transactional
    public void delete(Long id, HttpServletRequest httpRequest) {
        Folder folder = loadOwned(id);
        User user = folder.getUser();
        deleteRecursive(folder, user);
        auditService.log(user, "DELETE_FOLDER", "FOLDER", id, httpRequest.getRemoteAddr());
    }

    private void deleteRecursive(Folder folder, User user) {
        List<Folder> children = new ArrayList<>(folder.getChildren());
        for (Folder child : children) {
            deleteRecursive(child, user);
        }
        noteRepository.detachNotesFromFolder(user, folder.getId());
        folderRepository.delete(folder);
    }

    private Folder loadOwned(Long id) {
        User user = securityUtils.currentUser();
        Folder folder = folderRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        if (!folder.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Folder not found");
        }
        return folder;
    }
}

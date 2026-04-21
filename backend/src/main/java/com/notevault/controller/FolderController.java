package com.notevault.controller;

import com.notevault.dto.request.FolderRequest;
import com.notevault.dto.response.FolderResponse;
import com.notevault.service.FolderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @GetMapping
    public List<FolderResponse> tree() {
        return folderService.tree();
    }

    @PostMapping
    public FolderResponse create(@Valid @RequestBody FolderRequest request, HttpServletRequest httpRequest) {
        return folderService.create(request, httpRequest);
    }

    @PutMapping("/{id}")
    public FolderResponse rename(
            @PathVariable Long id,
            @Valid @RequestBody FolderRequest request,
            HttpServletRequest httpRequest
    ) {
        return folderService.rename(id, request, httpRequest);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, HttpServletRequest httpRequest) {
        folderService.delete(id, httpRequest);
    }
}

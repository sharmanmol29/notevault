package com.notevault.controller;

import com.notevault.dto.request.NoteRequest;
import com.notevault.dto.response.NoteResponse;
import com.notevault.service.NoteService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public List<NoteResponse> list(@RequestParam(value = "folderId", required = false) Long folderId) {
        return noteService.listActive(folderId);
    }

    @GetMapping("/{id}")
    public NoteResponse get(@PathVariable Long id) {
        return noteService.getById(id);
    }

    @PostMapping
    public NoteResponse create(@Valid @RequestBody NoteRequest request, HttpServletRequest httpRequest) {
        return noteService.create(request, httpRequest);
    }

    @PutMapping("/{id}")
    public NoteResponse update(
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request,
            HttpServletRequest httpRequest
    ) {
        return noteService.update(id, request, httpRequest);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, HttpServletRequest httpRequest) {
        noteService.softDelete(id, httpRequest);
    }

    @GetMapping("/search")
    public List<NoteResponse> search(@RequestParam("q") String q) {
        return noteService.search(q);
    }
}

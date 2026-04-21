package com.notevault.controller;

import com.notevault.dto.response.NoteResponse;
import com.notevault.service.RecycleBinService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recycle-bin")
@RequiredArgsConstructor
public class RecycleBinController {

    private final RecycleBinService recycleBinService;

    @GetMapping
    public List<NoteResponse> list() {
        return recycleBinService.listDeleted();
    }

    @PutMapping("/{id}/restore")
    public NoteResponse restore(@PathVariable Long id, HttpServletRequest httpRequest) {
        return recycleBinService.restore(id, httpRequest);
    }

    @DeleteMapping("/{id}")
    public void hardDelete(@PathVariable Long id, HttpServletRequest httpRequest) {
        recycleBinService.hardDelete(id, httpRequest);
    }

    @DeleteMapping("/empty")
    public void empty(HttpServletRequest httpRequest) {
        recycleBinService.empty(httpRequest);
    }
}

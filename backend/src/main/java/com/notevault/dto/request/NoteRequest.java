package com.notevault.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class NoteRequest {

    @Size(max = 500)
    private String title;

    private String content;

    private Long folderId;

    private Boolean moveToRoot;

    private List<@Size(max = 100) String> tags;
}

package com.notevault.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiNoteIdRequest {

    @NotNull
    private Long noteId;
}

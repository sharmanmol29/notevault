package com.notevault.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderResponse {

    private Long id;
    private String name;
    private Long parentId;
    private List<FolderResponse> children;
    private long noteCount;
    private LocalDateTime createdAt;
}

package com.notevault.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private String action;
    private String resourceType;
    private Long resourceId;
    private LocalDateTime timestamp;
    private String ipAddress;
}

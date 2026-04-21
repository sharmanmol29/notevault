package com.notevault.service;

import com.notevault.dto.response.AuditLogResponse;
import com.notevault.entity.AuditLog;
import com.notevault.entity.User;
import com.notevault.repository.AuditLogRepository;
import com.notevault.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> list(Pageable pageable) {
        User user = securityUtils.currentUser();
        return auditLogRepository.findByUserOrderByTimestampDesc(user, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public void log(User user, String action, String resourceType, Long resourceId, String ipAddress) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .action(log.getAction())
                .resourceType(log.getResourceType())
                .resourceId(log.getResourceId())
                .timestamp(log.getTimestamp())
                .ipAddress(log.getIpAddress())
                .build();
    }
}

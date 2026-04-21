package com.notevault.repository;

import com.notevault.entity.AuditLog;
import com.notevault.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByUserOrderByTimestampDesc(User user, Pageable pageable);
}

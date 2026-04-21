package com.notevault.scheduler;

import com.notevault.service.RecycleBinService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RecycleBinScheduler {

    private final RecycleBinService recycleBinService;

    @Value("${recycle.bin.auto-delete.days}")
    private int retentionDays;

    @Scheduled(cron = "0 0 2 * * ?")
    public void purgeExpiredDeletedNotes() {
        recycleBinService.purgeExpired(retentionDays);
    }
}

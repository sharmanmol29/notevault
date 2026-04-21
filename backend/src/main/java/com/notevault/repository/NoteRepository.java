package com.notevault.repository;

import com.notevault.entity.Note;
import com.notevault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByUserAndDeletedFalseOrderByUpdatedAtDesc(User user);

    List<Note> findByUserAndDeletedTrueOrderByDeletedAtDesc(User user);

    List<Note> findByUserAndFolder_IdAndDeletedFalseOrderByUpdatedAtDesc(User user, Long folderId);

    long countByUserAndFolder_IdAndDeletedFalse(User user, Long folderId);

    long countByUserAndDeletedFalse(User user);

    @Query("SELECT n FROM Note n WHERE n.user = :user AND n.deleted = false AND (LOWER(n.title) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Note> searchByTitle(@Param("user") User user, @Param("q") String q);

    @Query("SELECT n FROM Note n WHERE n.user = :user AND n.deleted = false AND n.updatedAt > :since ORDER BY n.updatedAt DESC")
    List<Note> findUpdatedAfter(@Param("user") User user, @Param("since") LocalDateTime since);

    @Query("SELECT n.id FROM Note n WHERE n.user = :user AND n.deleted = true AND n.deletedAt IS NOT NULL AND n.deletedAt > :since")
    List<Long> findDeletedIdsAfter(@Param("user") User user, @Param("since") LocalDateTime since);

    @Query("SELECT n FROM Note n WHERE n.deleted = true AND n.deletedAt IS NOT NULL AND n.deletedAt < :cutoff")
    List<Note> findExpiredDeleted(@Param("cutoff") LocalDateTime cutoff);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Note n SET n.folder = null WHERE n.user = :user AND n.folder.id = :folderId")
    void detachNotesFromFolder(@Param("user") User user, @Param("folderId") Long folderId);
}

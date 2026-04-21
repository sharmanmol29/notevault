package com.notevault.repository;

import com.notevault.entity.Folder;
import com.notevault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {

    List<Folder> findByUserAndParentIsNullOrderByNameAsc(User user);

    List<Folder> findByUserOrderByNameAsc(User user);
}

package com.photobooth.repository;

import com.photobooth.model.Album;
import com.photobooth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlbumRepository extends JpaRepository<Album, Long> {
    List<Album> findByUserOrderByCreatedAtDesc(User user);
    List<Album> findByUserId(Long userId);
}

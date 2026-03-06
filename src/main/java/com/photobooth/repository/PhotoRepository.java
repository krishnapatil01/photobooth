package com.photobooth.repository;

import com.photobooth.model.Photo;
import com.photobooth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    List<Photo> findByUserOrderByCreatedAtDesc(User user);
    List<Photo> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Photo> findByAlbumIdOrderByCreatedAtDesc(Long albumId);
    List<Photo> findByUserIdAndAlbumIsNull(Long userId);
    long countByUserId(Long userId);
}

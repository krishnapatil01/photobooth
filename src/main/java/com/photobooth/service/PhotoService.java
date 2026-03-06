package com.photobooth.service;

import com.photobooth.model.Album;
import com.photobooth.model.Photo;
import com.photobooth.model.User;
import com.photobooth.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final AlbumService albumService;

    public Photo savePhoto(String name, String memoryTitle, String imageData,
            String filter, boolean isStrip, User user, Long albumId) {
        Photo.PhotoBuilder builder = Photo.builder()
                .name(name)
                .memoryTitle(memoryTitle)
                .imageData(imageData)
                .filter(filter)
                .strip(isStrip)
                .user(user);

        if (albumId != null) {
            Album album = albumService.findById(albumId);
            builder.album(album);
            // Set first photo as cover if album has no cover
            if (album.getCoverImageData() == null) {
                albumService.setCoverPhoto(albumId, imageData);
            }
        }

        return photoRepository.save(builder.build());
    }

    public List<Photo> getPhotosByUser(User user) {
        return photoRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Photo> getPhotosByUserId(Long userId) {
        return photoRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Photo> getPhotosByAlbum(Long albumId) {
        return photoRepository.findByAlbumIdOrderByCreatedAtDesc(albumId);
    }

    public List<Photo> getUncategorizedPhotos(Long userId) {
        return photoRepository.findByUserIdAndAlbumIsNull(userId);
    }

    public Photo findById(Long id) {
        return photoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Photo not found"));
    }

    public Photo updatePhoto(Long id, String name, String memoryTitle, Long albumId) {
        Photo photo = findById(id);
        photo.setName(name);
        photo.setMemoryTitle(memoryTitle);
        if (albumId != null) {
            photo.setAlbum(albumService.findById(albumId));
        } else {
            photo.setAlbum(null);
        }
        return photoRepository.save(photo);
    }

    public void deletePhoto(Long id) {
        photoRepository.deleteById(id);
    }

    public long countByUser(Long userId) {
        return photoRepository.countByUserId(userId);
    }
}

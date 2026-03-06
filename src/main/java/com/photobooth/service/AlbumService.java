package com.photobooth.service;

import com.photobooth.model.Album;
import com.photobooth.model.User;
import com.photobooth.repository.AlbumRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;

    public Album createAlbum(String name, String description, User user) {
        Album album = Album.builder()
                .name(name)
                .description(description)
                .user(user)
                .build();
        return albumRepository.save(album);
    }

    public List<Album> getAlbumsByUser(User user) {
        return albumRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public Album findById(Long id) {
        return albumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found"));
    }

    public Album updateAlbum(Long id, String name, String description) {
        Album album = findById(id);
        album.setName(name);
        album.setDescription(description);
        return albumRepository.save(album);
    }

    public void deleteAlbum(Long id) {
        albumRepository.deleteById(id);
    }

    public void setCoverPhoto(Long albumId, String imageData) {
        Album album = findById(albumId);
        album.setCoverImageData(imageData);
        albumRepository.save(album);
    }
}

package com.photobooth.controller;

import com.photobooth.model.Album;
import com.photobooth.model.Photo;
import com.photobooth.model.User;
import com.photobooth.service.AlbumService;
import com.photobooth.service.PhotoService;
import com.photobooth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {

    private final UserService userService;
    private final PhotoService photoService;
    private final AlbumService albumService;

    // --- Photo APIs ---

    @PostMapping("/photos/save")
    public ResponseEntity<?> savePhoto(@RequestBody Map<String, Object> payload,
            Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName());
            String name = (String) payload.getOrDefault("name", "Photo");
            String memoryTitle = (String) payload.getOrDefault("memoryTitle", "");
            String imageData = (String) payload.get("imageData");
            String filter = (String) payload.getOrDefault("filter", "none");
            boolean isStrip = Boolean.TRUE.equals(payload.get("isStrip"));
            Long albumId = payload.get("albumId") != null ? Long.valueOf(payload.get("albumId").toString()) : null;

            Photo photo = photoService.savePhoto(name, memoryTitle, imageData, filter, isStrip, user, albumId);
            Map<String, Object> response = new HashMap<>();
            response.put("id", photo.getId());
            response.put("name", photo.getName());
            response.put("message", "Photo saved successfully!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/photos")
    public ResponseEntity<?> getPhotos(Authentication auth) {
        User user = userService.findByUsername(auth.getName());
        List<Photo> photos = photoService.getPhotosByUserId(user.getId());
        return ResponseEntity.ok(photos.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("name", p.getName());
            m.put("memoryTitle", p.getMemoryTitle());
            m.put("imageData", p.getImageData());
            m.put("filter", p.getFilter());
            m.put("isStrip", p.isStrip());
            m.put("albumId", p.getAlbum() != null ? p.getAlbum().getId() : null);
            m.put("albumName", p.getAlbum() != null ? p.getAlbum().getName() : null);
            m.put("createdAt", p.getCreatedAt());
            return m;
        }).toList());
    }

    @PutMapping("/photos/{id}")
    public ResponseEntity<?> updatePhoto(@PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication auth) {
        try {
            String name = (String) payload.getOrDefault("name", "Photo");
            String memoryTitle = (String) payload.getOrDefault("memoryTitle", "");
            Long albumId = payload.get("albumId") != null ? Long.valueOf(payload.get("albumId").toString()) : null;
            Photo photo = photoService.updatePhoto(id, name, memoryTitle, albumId);
            return ResponseEntity.ok(Map.of("message", "Updated!", "id", photo.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/photos/{id}")
    public ResponseEntity<?> deletePhoto(@PathVariable Long id) {
        try {
            photoService.deletePhoto(id);
            return ResponseEntity.ok(Map.of("message", "Photo deleted!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- Album APIs ---

    @PostMapping("/albums")
    public ResponseEntity<?> createAlbum(@RequestBody Map<String, String> payload,
            Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName());
            Album album = albumService.createAlbum(payload.get("name"), payload.get("description"), user);
            return ResponseEntity.ok(Map.of("id", album.getId(), "name", album.getName(), "message", "Album created!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/albums")
    public ResponseEntity<?> getAlbums(Authentication auth) {
        User user = userService.findByUsername(auth.getName());
        List<Album> albums = albumService.getAlbumsByUser(user);
        return ResponseEntity.ok(albums.stream().map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("name", a.getName());
            m.put("description", a.getDescription());
            m.put("coverPhoto", a.getCoverImageData());
            m.put("createdAt", a.getCreatedAt());
            return m;
        }).toList());
    }

    @PutMapping("/albums/{id}")
    public ResponseEntity<?> updateAlbum(@PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        try {
            Album album = albumService.updateAlbum(id, payload.get("name"), payload.get("description"));
            return ResponseEntity.ok(Map.of("message", "Album updated!", "id", album.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/albums/{id}")
    public ResponseEntity<?> deleteAlbum(@PathVariable Long id) {
        try {
            albumService.deleteAlbum(id);
            return ResponseEntity.ok(Map.of("message", "Album deleted!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/albums/{id}/photos")
    public ResponseEntity<?> getAlbumPhotos(@PathVariable Long id) {
        List<Photo> photos = photoService.getPhotosByAlbum(id);
        return ResponseEntity.ok(photos.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("name", p.getName());
            m.put("memoryTitle", p.getMemoryTitle());
            m.put("imageData", p.getImageData());
            m.put("filter", p.getFilter());
            m.put("isStrip", p.isStrip());
            m.put("createdAt", p.getCreatedAt());
            return m;
        }).toList());
    }
}

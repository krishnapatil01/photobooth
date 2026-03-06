package com.photobooth.controller;

import com.photobooth.model.Album;
import com.photobooth.model.Photo;
import com.photobooth.model.User;
import com.photobooth.service.AlbumService;
import com.photobooth.service.PhotoService;
import com.photobooth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class DashboardController {

    private final UserService userService;
    private final PhotoService photoService;
    private final AlbumService albumService;

    @GetMapping("/dashboard")
    public String dashboard(Authentication auth, Model model) {
        User user = userService.findByUsername(auth.getName());
        List<Photo> recentPhotos = photoService.getPhotosByUserId(user.getId());
        List<Album> albums = albumService.getAlbumsByUser(user);
        long totalPhotos = photoService.countByUser(user.getId());

        // Count memories: either has a title or belongs to an album
        long totalMemories = recentPhotos.stream()
                .filter(p -> (p.getMemoryTitle() != null && !p.getMemoryTitle().isEmpty()) || p.getAlbum() != null)
                .count();

        model.addAttribute("user", user);
        model.addAttribute("recentPhotos", recentPhotos.stream().limit(6).toList());
        model.addAttribute("albums", albums);
        model.addAttribute("totalPhotos", totalPhotos);
        model.addAttribute("totalAlbums", albums.size());
        model.addAttribute("totalMemories", totalMemories);
        return "dashboard/home";
    }

    @GetMapping("/photobooth")
    public String photobooth(Authentication auth, Model model) {
        User user = userService.findByUsername(auth.getName());
        List<Album> albums = albumService.getAlbumsByUser(user);
        model.addAttribute("user", user);
        model.addAttribute("albums", albums);
        return "dashboard/photobooth";
    }

    @GetMapping("/gallery")
    public String gallery(Authentication auth, Model model) {
        User user = userService.findByUsername(auth.getName());
        List<Photo> photos = photoService.getPhotosByUserId(user.getId());
        List<Album> albums = albumService.getAlbumsByUser(user);
        model.addAttribute("user", user);
        model.addAttribute("photos", photos);
        model.addAttribute("albums", albums);
        return "dashboard/gallery";
    }

    @GetMapping("/album/{id}")
    public String albumView(@PathVariable Long id, Authentication auth, Model model) {
        User user = userService.findByUsername(auth.getName());
        Album album = albumService.findById(id);
        List<Photo> photos = photoService.getPhotosByAlbum(id);
        List<Album> allAlbums = albumService.getAlbumsByUser(user);
        model.addAttribute("user", user);
        model.addAttribute("album", album);
        model.addAttribute("photos", photos);
        model.addAttribute("albums", allAlbums);
        return "dashboard/album";
    }

    @GetMapping("/memory-corner")
    public String memoryCorner(Authentication auth, Model model) {
        User user = userService.findByUsername(auth.getName());
        List<Photo> photos = photoService.getPhotosByUserId(user.getId());
        model.addAttribute("user", user);
        model.addAttribute("photos", photos);
        return "dashboard/memory-corner";
    }
}

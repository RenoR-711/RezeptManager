package com.rezeptmanager.backend.service;

import com.rezeptmanager.backend.exception.ImageStorageException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

@Service
public class ImageStorageService {

    private final Path root = Paths.get("uploads");

    public String storeImage(Long recipeId, MultipartFile file) {

        if (recipeId == null) {
            throw new ImageStorageException("Recipe ID must not be null when storing an image.");
        }

        if (file == null || file.isEmpty()) {
            throw new ImageStorageException("Image file is empty.");
        }

        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(name -> name.contains("."))
                .map(name -> name.substring(name.lastIndexOf(".")))
                .orElse(".png");

        Path dir = root.resolve("recipes").resolve(String.valueOf(recipeId));

        try {
            Files.createDirectories(dir);

            Path target = dir.resolve("main" + ext);

            Files.copy(
                    file.getInputStream(),
                    target,
                    StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/recipes/" + recipeId + "/main" + ext;

        } catch (IOException e) {
            throw new ImageStorageException("Could not save recipe image", e);
        }
    }
}

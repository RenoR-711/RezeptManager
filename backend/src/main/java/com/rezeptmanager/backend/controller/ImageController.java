package com.rezeptmanager.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.rezeptmanager.backend.service.ImageStorageService;

import java.util.Map;

@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = "http://localhost:5173")
public class ImageController {

    
    private final ImageStorageService imageStorageService;
    
    public ImageController(ImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    @PostMapping(value = "/recipes/{recipeId}", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, String>> saveRecipeImage(
            @PathVariable Long recipeId,
            @RequestParam("file") MultipartFile file) {
        String imagePath = imageStorageService.storeImage(recipeId, file);
        return ResponseEntity.ok(Map.of("imagePath", imagePath));
    }
}
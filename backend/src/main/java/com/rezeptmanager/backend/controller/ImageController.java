package com.rezeptmanager.backend.controller;

import com.rezeptmanager.backend.service.ImageStorageService;
import com.rezeptmanager.backend.service.RecipeService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = "http://localhost:5173")
public class ImageController {

    private final ImageStorageService imageStorageService;
    private final RecipeService recipeService;

    public ImageController(
            ImageStorageService imageStorageService,
            RecipeService recipeService) {
        this.imageStorageService = imageStorageService;
        this.recipeService = recipeService;
    }

    /*
     * -------------------------------------------------------------
     * Rezeptbild hochladen
     * -------------------------------------------------------------
     */

    @PostMapping(value = "/recipes/{recipeId}", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, String>> uploadRecipeImage(
            @PathVariable Long recipeId,
            @RequestParam("file") MultipartFile file) {

        recipeService.findById(recipeId);

        String imageUrl = imageStorageService.storeImage(recipeId, file);
        recipeService.updateImageUrl(recipeId, imageUrl);

        return ResponseEntity.ok(Map.of(
                "imageUrl", imageUrl,
                "message", "Bild erfolgreich gespeichert."));
    }
}
package com.rezeptmanager.backend.controller;

import com.rezeptmanager.backend.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PdfExportController {

    private final RecipeService recipeService;

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> exportRecipeAsPdf(@PathVariable Long id) {
        return recipeService.exportRecipeToPdf(id);
    }
}
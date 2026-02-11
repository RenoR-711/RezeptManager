package com.rezeptmanager.backend.controller;

import com.rezeptmanager.backend.model.Category;
import com.rezeptmanager.backend.model.Recipe;
import com.rezeptmanager.backend.repo.CategoryRepository;
import com.rezeptmanager.backend.repo.RecipeRepository;
import com.rezeptmanager.backend.service.ImageStorageService;
import com.rezeptmanager.backend.service.PdfExportService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "http://localhost:5173")
public class RecipeController {

        private final RecipeRepository repo;
        private final CategoryRepository categoryRepo;
        private final PdfExportService pdfExportService;
        private final ImageStorageService imageStorageService;

        public RecipeController(
                        RecipeRepository repo,
                        CategoryRepository categoryRepo,
                        PdfExportService pdfExportService,
                        ImageStorageService imageStorageService) {
                this.repo = repo;
                this.categoryRepo = categoryRepo;
                this.pdfExportService = pdfExportService;
                this.imageStorageService = imageStorageService;
        }

        // -------------------------------------------------------------
        // Alle Rezepte abrufen
        // -------------------------------------------------------------
        @GetMapping
        public List<Recipe> getAllRecipes() {
                return repo.findAllByOrderByTitleAsc();
        }

        // -------------------------------------------------------------
        // Einzelnes Rezept abrufen
        // -------------------------------------------------------------
        @GetMapping("/{id}")
        public Recipe getOne(@PathVariable Long id) {
                return repo.findById(id).orElseThrow();
        }

        // -------------------------------------------------------------
        // Neues Rezept speichern
        // -------------------------------------------------------------
        @PostMapping
        public Recipe create(@RequestBody Recipe r) {

                Set<Category> resolvedCategories = (r.getCategories() == null ? Set.<Category>of() : r.getCategories())
                                .stream()
                                .map(cat -> categoryRepo.findByName(cat.getName())
                                                .orElseGet(() -> categoryRepo.save(new Category(cat.getName()))))
                                .collect(Collectors.toSet());

                r.setCategories(resolvedCategories);

                // BILD-LOGIK (zentral, ausgelagert)
                return repo.save(r);
        }

        // -------------------------------------------------------------
        // Rezept aktualisieren
        // -------------------------------------------------------------

        @PutMapping("/{id}")
        public Recipe update(@PathVariable Long id, @RequestBody Recipe r) {
                Recipe existing = repo.findById(id).orElseThrow();

                existing.setTitle(r.getTitle());
                existing.setDescription(r.getDescription());
                existing.setIngredients(r.getIngredients());
                existing.setRawText(r.getRawText());
                existing.setDifficultyLevel(r.getDifficultyLevel());
                existing.setPreparationTime(r.getPreparationTime());
                existing.setCookingTime(r.getCookingTime());
                existing.setServings(r.getServings());
                existing.setCalories(r.getCalories());
                existing.setCarbohydrates(r.getCarbohydrates());
                existing.setFats(r.getFats());
                existing.setProtein(r.getProtein());
                existing.setRating(r.getRating());

                // imageUrl übernehmen + (optional) serverseitig absichern
                existing.setImageUrl(r.getImageUrl());

                // Kategorien korrekt auflösen (null-sicher)
                Set<Category> resolvedCategories = (r.getCategories() == null ? Set.<Category>of() : r.getCategories())
                                .stream()
                                .map(cat -> categoryRepo.findByName(cat.getName())
                                                .orElseGet(() -> categoryRepo.save(new Category(cat.getName()))))
                                .collect(Collectors.toSet());

                existing.setCategories(resolvedCategories);

                return repo.save(existing);
        }

        // -------------------------------------------------------------
        // Image speichern (Multipart) und imageUrl im Rezept setzen
        // POST /api/recipes/{id}/image
        // FormData key: "file"
        // -------------------------------------------------------------
        @PostMapping(value = "/{id}/image", consumes = "multipart/form-data")
        public ResponseEntity<String> saveRecipeImage(
                        @PathVariable Long id,
                        @RequestParam("file") MultipartFile file) {
                Recipe recipe = repo.findById(id).orElseThrow();

                String imagePath = imageStorageService.storeImage(id, file);

                recipe.setImageUrl(imagePath);
                repo.save(recipe);

                return ResponseEntity.ok(imagePath);
        }

        // -------------------------------------------------------------
        // Rezept löschen
        // -------------------------------------------------------------
        @DeleteMapping("/{id}")
        public void delete(@PathVariable Long id) {
                repo.deleteById(id);
        }

        // -------------------------------------------------------------
        // PDF Export
        // -------------------------------------------------------------
        @GetMapping("/{id}/pdf")
        public ResponseEntity<byte[]> exportPdf(@PathVariable Long id) {
                Recipe recipe = repo.findById(id).orElseThrow();

                byte[] pdf = pdfExportService.exportRecipeToPdf(recipe);

                return ResponseEntity.ok()
                                .header("Content-Disposition", "attachment; filename=\"" + recipe.getTitle() + ".pdf\"")
                                .header("Content-Type", "application/pdf")
                                .body(pdf);
        }

}
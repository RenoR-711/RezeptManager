package com.rezeptmanager.backend.controller;

import com.rezeptmanager.backend.model.Recipe;
import com.rezeptmanager.backend.model.Category;
import com.rezeptmanager.backend.repo.CategoryRepository;
import com.rezeptmanager.backend.repo.RecipeRepository;
import com.rezeptmanager.backend.service.ImageService;
import com.rezeptmanager.backend.service.PdfExportService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    private final ImageService imageService;

    public RecipeController(RecipeRepository repo,
            CategoryRepository categoryRepo,
            PdfExportService pdfExportService,
            ImageService imageService) {
        this.repo = repo;
        this.categoryRepo = categoryRepo;
        this.pdfExportService = pdfExportService;
        this.imageService = imageService;
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

        // Kategorien auflösen
        Set<Category> resolvedCategories = r.getCategories().stream()
                .map(cat -> categoryRepo.findByName(cat.getName())
                        .orElseGet(() -> categoryRepo.save(
                                new Category(cat.getName()))))
                .collect(Collectors.toSet());

        r.setCategories(resolvedCategories);

        // BILD-LOGIK (zentral, ausgelagert)
        r.setImageUrl(
                imageService.resolveImageUrl(
                        r.getTitle(),
                        r.getImageUrl(),
                        null // noch keine ID beim Create
                ));

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
        existing.setSourceFile(r.getSourceFile());
        existing.setImagePath(r.getImagePath());
        existing.setRawText(r.getRawText());

        // Kategorien korrekt auflösen
        Set<Category> resolvedCategories = r.getCategories().stream()
                .map(cat -> categoryRepo.findByName(cat.getName())
                        .orElseGet(() -> categoryRepo.save(
                                new Category(cat.getName()))))
                .collect(Collectors.toSet());

        existing.setCategories(resolvedCategories);

        return repo.save(existing);
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
    @GetMapping(value = "/{id}/pdf", produces = "application/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        Recipe recipe = repo.findById(id).orElseThrow();
        byte[] pdf = pdfExportService.exportRecipeToPdf(recipe);

        return ResponseEntity.ok()
                .header("Content-Disposition",
                        "inline; filename=\"recipe_" + id + ".pdf\"")
                .body(pdf);
    }
}

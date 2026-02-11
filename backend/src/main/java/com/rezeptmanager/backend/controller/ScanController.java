package com.rezeptmanager.backend.controller;

import com.rezeptmanager.backend.dto.ParsedRecipe;
import com.rezeptmanager.backend.model.Recipe;
import com.rezeptmanager.backend.repo.RecipeRepository;
import com.rezeptmanager.backend.service.BarcodeService;
import com.rezeptmanager.backend.service.IngredientParserService;
import com.rezeptmanager.backend.service.TextExtractorService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/scan")
@CrossOrigin(origins = "http://localhost:5173")
public class ScanController {

    private final BarcodeService barcodeService;
    private final RecipeRepository recipeRepository;
    private final TextExtractorService textExtractorService;
    private final IngredientParserService ingredientParserService;

    public ScanController(
            BarcodeService barcodeService,
            RecipeRepository recipeRepository,
            TextExtractorService textExtractorService,
            IngredientParserService ingredientParserService) {
        this.barcodeService = barcodeService;
        this.recipeRepository = recipeRepository;
        this.textExtractorService = textExtractorService;
        this.ingredientParserService = ingredientParserService;
    }

    // ------------------------------------------------------------
    // 1) PREVIEW – nur analysieren, NICHT speichern
    // ------------------------------------------------------------

    @PostMapping("/image-preview")
    public Recipe scanImagePreview(@RequestParam("file") MultipartFile file) {
        requireImage(file);

        String text = textExtractorService.extractTextFromImage(file);
        ParsedRecipe parsed = ingredientParserService.parse(text);

        Recipe r = new Recipe();
        r.setTitle(parsed.getTitle());
        r.setIngredients(parsed.getIngredients());
        r.setDescription(parsed.getDescription());
        r.setRawText(text);

        return r;
    }

    @PostMapping("/file-preview")
    public Recipe scanFilePreview(@RequestParam("file") MultipartFile file) {
        requirePdf(file);

        String text = textExtractorService.extractTextFromPdf(file);
        ParsedRecipe parsed = ingredientParserService.parse(text);

        Recipe r = new Recipe();
        r.setTitle(parsed.getTitle());
        r.setIngredients(parsed.getIngredients());
        r.setDescription(parsed.getDescription());
        r.setRawText(text);

        return r;
    }

    // ------------------------------------------------------------
    // 2) ANALYSE + SPEICHERN
    // ------------------------------------------------------------

    @PostMapping("/image")
    public Recipe scanImageAndSave(@RequestParam("file") MultipartFile file) {
        try {
            requireImage(file);

            // Optional: Bild auch speichern (wie bei PDF). Wenn du das nicht willst:
            // weglassen.
            String fileName = saveUploadedFile(file);

            String text = textExtractorService.extractTextFromImage(file);
            ParsedRecipe parsed = ingredientParserService.parse(text);

            Recipe r = new Recipe();
            r.setTitle(parsed.getTitle());
            r.setIngredients(parsed.getIngredients());
            r.setDescription(parsed.getDescription());
            r.setRawText(text);
            r.setSourceFile(fileName);

            return recipeRepository.save(r);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Fehler beim Image-Scan: " + e.getMessage(),
                    e);
        }
    }

    @PostMapping("/file")
    public Recipe scanFileAndSave(@RequestParam("file") MultipartFile file) {
        try {
            requirePdf(file);

            String fileName = saveUploadedFile(file);

            String text = textExtractorService.extractTextFromPdf(file);
            ParsedRecipe parsed = ingredientParserService.parse(text);

            Recipe r = new Recipe();
            r.setTitle(parsed.getTitle());
            r.setIngredients(parsed.getIngredients());
            r.setDescription(parsed.getDescription());
            r.setRawText(text);
            r.setSourceFile(fileName);

            return recipeRepository.save(r);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Fehler beim Datei-Upload: " + e.getMessage(),
                    e);
        }
    }

    // ------------------------------------------------------------
    // 3) BARCODE-Abfrage
    // ------------------------------------------------------------

    @GetMapping("/barcode/{ean}")
    public Object lookupBarcode(@PathVariable String ean) {
        return barcodeService.lookupProduct(ean);
    }

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------

    private void requirePdf(MultipartFile file) {
        String name = safeLowerName(file);
        if (!name.endsWith(".pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nur PDF wird unterstützt.");
        }
    }

    private void requireImage(MultipartFile file) {
        String name = safeLowerName(file);
        if (!(name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nur JPG/PNG/WEBP wird unterstützt.");
        }
    }

    private String saveUploadedFile(MultipartFile file) throws IOException {
        Path uploadDir = Paths.get("uploads");
        Files.createDirectories(uploadDir);

        String original = file.getOriginalFilename();
        String safeOriginal = (original == null || original.isBlank()) ? "file.bin"
                : original.replaceAll("[\\\\/:*?\"<>|]", "_");

        String fileName = System.currentTimeMillis() + "_" + safeOriginal;
        Path filePath = uploadDir.resolve(fileName);

        Files.copy(file.getInputStream(), filePath);
        return fileName;
    }

    private String safeLowerName(MultipartFile file) {
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dateiname fehlt.");
        }
        return original.toLowerCase();
    }
}

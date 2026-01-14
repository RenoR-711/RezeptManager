package com.rezeptmanager.backend.controller;

import com.rezeptmanager.backend.model.Recipe;
import com.rezeptmanager.backend.repo.RecipeRepository;
import com.rezeptmanager.backend.service.BarcodeService;
import com.rezeptmanager.backend.service.OcrService;
import com.rezeptmanager.backend.service.PdfService;
import com.rezeptmanager.backend.dto.ParsedRecipe;
import com.rezeptmanager.backend.service.IngredientParserService;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/scan")
@CrossOrigin(origins = "http://localhost:5173")
public class ScanController {

    private final OcrService ocrService;
    private final BarcodeService barcodeService;
    private final RecipeRepository recipeRepository;
    private final PdfService pdfService;
    private final IngredientParserService ingredientParserService;

    public ScanController(OcrService ocrService,
            BarcodeService barcodeService,
            RecipeRepository recipeRepository,
            PdfService pdfService,
            IngredientParserService ingredientParserService) {

        this.ocrService = ocrService;
        this.barcodeService = barcodeService;
        this.recipeRepository = recipeRepository;
        this.pdfService = pdfService;
        this.ingredientParserService = ingredientParserService;
    }

    // ------------------------------------------------------------
    // 1. PREVIEW – nur analysieren, NICHT speichern
    // ------------------------------------------------------------

    @PostMapping("/image-preview")
    public Recipe scanImagePreview(@RequestParam("file") MultipartFile file) {
        String text = ocrService.extractTextFromImage(file);
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
        String name = file.getOriginalFilename().toLowerCase();
        String text;

        if (name.endsWith(".pdf")) {
            text = pdfService.extractTextFromPdf(file);
        } else {
            text = ocrService.extractTextFromFile(file);
        }

        ParsedRecipe parsed = ingredientParserService.parse(text);

        Recipe r = new Recipe();
        r.setTitle(parsed.getTitle());
        r.setIngredients(parsed.getIngredients());
        r.setDescription(parsed.getDescription());
        r.setRawText(text);

        return r;
    }

    // ------------------------------------------------------------
    // 2. ANALYSE + SPEICHERN
    // ------------------------------------------------------------

    @PostMapping("/image")
    public Recipe scanImageAndSave(@RequestParam("file") MultipartFile file) {
        try {
            String fileName = saveUploadedFile(file);
            String text = ocrService.extractTextFromImage(file);

            ParsedRecipe parsed = ingredientParserService.parse(text);

            Recipe r = new Recipe();
            r.setTitle(parsed.getTitle());
            r.setIngredients(parsed.getIngredients());
            r.setDescription(parsed.getDescription());
            r.setRawText(text);
            r.setSourceFile(fileName);

            return recipeRepository.save(r);

        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Speichern des Bildes: " + e.getMessage());
        }
    }

    @PostMapping("/file")
    public Recipe scanFileAndSave(@RequestParam("file") MultipartFile file) {
        try {
            String fileName = saveUploadedFile(file);
            String name = file.getOriginalFilename().toLowerCase();
            String text;

            if (name.endsWith(".pdf")) {
                text = pdfService.extractTextFromPdf(file);
            } else {
                text = ocrService.extractTextFromFile(file);
            }

            ParsedRecipe parsed = ingredientParserService.parse(text);

            Recipe r = new Recipe();
            r.setTitle(parsed.getTitle());
            r.setIngredients(parsed.getIngredients());
            r.setDescription(parsed.getDescription());
            r.setRawText(text);
            r.setSourceFile(fileName);

            return recipeRepository.save(r);

        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Datei-Upload: " + e.getMessage());
        }
    }

    // ------------------------------------------------------------
    // 3. BARCODE-Abfrage
    // ------------------------------------------------------------

    @GetMapping("/barcode/{ean}")
    public Object lookupBarcode(@PathVariable String ean) {
        return barcodeService.lookupProduct(ean);
    }

    // ------------------------------------------------------------
    // 4. Datei speichern
    // ------------------------------------------------------------

    private String saveUploadedFile(MultipartFile file) throws Exception {
        Path uploadDir = Paths.get("uploads");
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = uploadDir.resolve(fileName);

        Files.write(filePath, file.getBytes());
        return fileName;
    }
}

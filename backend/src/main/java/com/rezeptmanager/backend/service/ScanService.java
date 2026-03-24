package com.rezeptmanager.backend.service;

import com.rezeptmanager.backend.dto.ParsedRecipe;
import com.rezeptmanager.backend.model.Recipe;
import com.rezeptmanager.backend.repo.RecipeRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/* =========================================================
   ScanService
   ---------------------------------------------------------
   Kapselt den kompletten Scan-Flow für Bild- und PDF-Dateien.

   Verantwortung:
   - Upload-Dateien validieren
   - Text aus Bild/PDF extrahieren
   - Text in Rezeptdaten parsen
   - Preview-Daten erzeugen
   - gescannte Rezepte speichern
   - Originaldateien im Upload-Ordner ablegen

   Nicht verantwortlich für:
   - HTTP-Routing
   - Barcode-Produktlogik
========================================================= */

@Service
public class ScanService {

    private static final Path SCAN_UPLOAD_DIR = Path.of("uploads", "scans");

    private final RecipeRepository recipeRepository;
    private final TextExtractorService textExtractorService;
    private final IngredientParserService ingredientParserService;

    public ScanService(
            RecipeRepository recipeRepository,
            TextExtractorService textExtractorService,
            IngredientParserService ingredientParserService) {
        this.recipeRepository = recipeRepository;
        this.textExtractorService = textExtractorService;
        this.ingredientParserService = ingredientParserService;
    }

    /*
     * -------------------------------------------------------------
     * Preview
     * -------------------------------------------------------------
     */

    public ParsedRecipe previewImage(MultipartFile file) {
        validateImage(file);
        return parseImage(file);
    }

    public ParsedRecipe previewPdf(MultipartFile file) {
        validatePdf(file);
        return parsePdf(file);
    }

    /*
     * -------------------------------------------------------------
     * Scan + Save
     * -------------------------------------------------------------
     */

    public Recipe scanImageAndSave(MultipartFile file) {
        validateImage(file);
        return saveScannedRecipe(file, false);
    }

    public Recipe scanPdfAndSave(MultipartFile file) {
        validatePdf(file);
        return saveScannedRecipe(file, true);
    }

    /*
     * -------------------------------------------------------------
     * Parsing
     * -------------------------------------------------------------
     */

    private ParsedRecipe parseImage(MultipartFile file) {
        String rawText = extractTextFromImage(file);
        return buildParsedRecipe(rawText);
    }

    private ParsedRecipe parsePdf(MultipartFile file) {
        String rawText = extractTextFromPdf(file);
        return buildParsedRecipe(rawText);
    }

    private String extractTextFromImage(MultipartFile file) {
        try {
            return textExtractorService.extractTextFromImage(file);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Fehler beim Bild-Scan.",
                    e);
        }
    }

    private String extractTextFromPdf(MultipartFile file) {
        try {
            return textExtractorService.extractTextFromPdf(file);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Fehler beim PDF-Scan.",
                    e);
        }
    }

    private ParsedRecipe buildParsedRecipe(String rawText) {
        ParsedRecipe parsed = ingredientParserService.parse(rawText);

        if (parsed == null) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Scan-Ergebnis konnte nicht verarbeitet werden.");
        }

        parsed.setRawText(rawText);
        return parsed;
    }

    /*
     * -------------------------------------------------------------
     * Save Flow
     * -------------------------------------------------------------
     */

    private Recipe saveScannedRecipe(MultipartFile file, boolean pdf) {
        try {
            ParsedRecipe parsed = pdf ? parsePdf(file) : parseImage(file);
            String sourceFile = saveUploadedSourceFile(file);

            Recipe recipe = mapParsedRecipeToEntity(parsed, sourceFile);
            return recipeRepository.save(recipe);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Datei konnte nicht gespeichert werden.",
                    e);
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    pdf ? "Fehler beim PDF-Scan." : "Fehler beim Bild-Scan.",
                    e);
        }
    }

    private Recipe mapParsedRecipeToEntity(ParsedRecipe parsed, String sourceFile) {
        Recipe recipe = new Recipe();

        recipe.setTitle(trimToNull(parsed.getTitle()));
        recipe.setIngredients(trimToNull(parsed.getIngredients()));
        recipe.setDescription(trimToNull(parsed.getDescription()));
        recipe.setRawText(trimToNull(parsed.getRawText()));
        recipe.setSourceFile(sourceFile);

        return recipe;
    }

    /*
     * -------------------------------------------------------------
     * Datei-Validierung
     * -------------------------------------------------------------
     */

    private void validatePdf(MultipartFile file) {
        validateFilePresent(file);

        String name = safeLowerName(file);

        if (!name.endsWith(".pdf")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nur PDF-Dateien werden unterstützt.");
        }
    }

    private void validateImage(MultipartFile file) {
        validateFilePresent(file);

        String name = safeLowerName(file);

        boolean supported = name.endsWith(".jpg")
                || name.endsWith(".jpeg")
                || name.endsWith(".png")
                || name.endsWith(".webp");

        if (!supported) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nur JPG, JPEG, PNG und WEBP werden unterstützt.");
        }
    }

    private void validateFilePresent(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Es wurde keine Datei hochgeladen.");
        }
    }

    private String safeLowerName(MultipartFile file) {
        String original = file.getOriginalFilename();

        if (original == null || original.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dateiname fehlt.");
        }

        return original.toLowerCase().trim();
    }

    /*
     * -------------------------------------------------------------
     * Originaldatei speichern
     * -------------------------------------------------------------
     */

    private String saveUploadedSourceFile(MultipartFile file) throws IOException {
        Files.createDirectories(SCAN_UPLOAD_DIR);

        String originalName = file.getOriginalFilename();
        String sanitizedOriginalName = sanitizeFilename(originalName);
        String fileName = System.currentTimeMillis() + "_" + sanitizedOriginalName;

        Path targetPath = SCAN_UPLOAD_DIR.resolve(fileName);

        Files.copy(
                file.getInputStream(),
                targetPath,
                StandardCopyOption.REPLACE_EXISTING);

        return fileName;
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "upload.bin";
        }

        return filename
                .trim()
                .replaceAll("[\\\\/:*?\"<>|]", "_")
                .replaceAll("\\s+", "_");
    }

    /*
     * -------------------------------------------------------------
     * Helper
     * -------------------------------------------------------------
     */

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
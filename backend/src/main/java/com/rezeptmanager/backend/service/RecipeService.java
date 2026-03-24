package com.rezeptmanager.backend.service;

import com.rezeptmanager.backend.dto.RecipeRequestDto;
import com.rezeptmanager.backend.dto.RecipeResponseDto;
import com.rezeptmanager.backend.mapper.RecipeMapper;
import com.rezeptmanager.backend.model.Category;
import com.rezeptmanager.backend.model.Recipe;
import com.rezeptmanager.backend.repo.CategoryRepository;
import com.rezeptmanager.backend.repo.RecipeRepository;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final CategoryRepository categoryRepository;
    private final PdfExportService pdfExportService;

    public RecipeService(
            RecipeRepository recipeRepository,
            CategoryRepository categoryRepository,
            PdfExportService pdfExportService) {
        this.recipeRepository = recipeRepository;
        this.categoryRepository = categoryRepository;
        this.pdfExportService = pdfExportService;
    }

    /*
     * ---------------------------------------------------------
     * Lesen
     * ---------------------------------------------------------
     */

    public List<RecipeResponseDto> findAll() {
        return recipeRepository.findAllByOrderByTitleAsc()
                .stream()
                .map(RecipeMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    public RecipeResponseDto findById(Long id) {
        return RecipeMapper.toResponseDto(findEntityById(id));
    }

    /*
     * ---------------------------------------------------------
     * Erstellen
     * ---------------------------------------------------------
     */

    public RecipeResponseDto create(RecipeRequestDto dto) {
        Recipe recipe = RecipeMapper.toEntity(dto);
        recipe.setCategories(resolveCategories(dto.getCategories()));

        Recipe savedRecipe = recipeRepository.save(recipe);
        return RecipeMapper.toResponseDto(savedRecipe);
    }

    /*
     * ---------------------------------------------------------
     * Aktualisieren
     * ---------------------------------------------------------
     */

    public RecipeResponseDto update(Long id, RecipeRequestDto dto) {
        Recipe existingRecipe = findEntityById(id);

        RecipeMapper.applyToEntity(dto, existingRecipe);
        existingRecipe.setCategories(resolveCategories(dto.getCategories()));

        Recipe savedRecipe = recipeRepository.save(existingRecipe);
        return RecipeMapper.toResponseDto(savedRecipe);
    }

    public RecipeResponseDto updateImageUrl(Long id, String imageUrl) {
        Recipe recipe = findEntityById(id);
        recipe.setImageUrl(imageUrl);

        Recipe savedRecipe = recipeRepository.save(recipe);
        return RecipeMapper.toResponseDto(savedRecipe);
    }

    /*
     * ---------------------------------------------------------
     * Löschen
     * ---------------------------------------------------------
     */

    public void delete(Long id) {
        Recipe recipe = findEntityById(id);
        recipeRepository.delete(recipe);
    }

    /*
     * ---------------------------------------------------------
     * PDF Export
     * ---------------------------------------------------------
     */

    public ResponseEntity<byte[]> exportPdf(Long id) {
        Recipe recipe = findEntityById(id);
        byte[] pdf = pdfExportService.exportRecipeToPdf(recipe);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + recipe.getTitle() + ".pdf\"")
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(pdf);
    }

    /*
     * ---------------------------------------------------------
     * Hilfsmethoden
     * ---------------------------------------------------------
     */

    private Recipe findEntityById(Long id) {
        return recipeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Rezept nicht gefunden."));
    }

    private Set<Category> resolveCategories(List<String> categoryNames) {
        if (categoryNames == null) {
            return Set.of();
        }

        return categoryNames.stream()
                .filter(name -> name != null && !name.isBlank())
                .map(String::trim)
                .map(name -> categoryRepository.findByName(name)
                        .orElseGet(() -> categoryRepository.save(new Category(name))))
                .collect(Collectors.toSet());
    }
}
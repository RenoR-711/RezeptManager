package com.rezeptmanager.backend.mapper;

import com.rezeptmanager.backend.dto.RecipeRequestDto;
import com.rezeptmanager.backend.dto.RecipeResponseDto;
import com.rezeptmanager.backend.model.Category;
import com.rezeptmanager.backend.model.DifficultyLevel;
import com.rezeptmanager.backend.model.Recipe;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * -------------------------------------------------------------
 * RecipeMapper
 * -------------------------------------------------------------
 * Wandelt zwischen Recipe-Entity und API-DTOs um.
 *
 * Enthält nur Mapping-Logik:
 * - Request DTO -> Entity
 * - Request DTO -> bestehende Entity aktualisieren
 * - Entity -> Response DTO
 * -------------------------------------------------------------
 */
public final class RecipeMapper {

    private RecipeMapper() {
        // Utility class
    }

    /*
     * ---------------------------------------------------------
     * Request DTO -> Entity
     * ---------------------------------------------------------
     */

    public static Recipe toEntity(RecipeRequestDto dto) {
        if (dto == null) {
            return null;
        }

        Recipe recipe = new Recipe();
        applyToEntity(dto, recipe);
        return recipe;
    }

    /*
     * ---------------------------------------------------------
     * Request DTO -> bestehende Entity
     * ---------------------------------------------------------
     */

    public static void applyToEntity(RecipeRequestDto dto, Recipe recipe) {
        if (dto == null || recipe == null) {
            return;
        }

        recipe.setTitle(trim(dto.getTitle()));
        recipe.setDescription(trim(dto.getDescription()));
        recipe.setIngredients(trim(dto.getIngredients()));
        recipe.setInstructions(trim(dto.getInstructions()));
        recipe.setImageUrl(trim(dto.getImageUrl()));

        recipe.setDifficultyLevel(mapDifficulty(dto.getDifficultyLevel()));
        recipe.setPrepTimeMinutes(dto.getPrepTimeMinutes());
        recipe.setCookTimeMinutes(dto.getCookTimeMinutes());
        recipe.setServings(dto.getServings());

        recipe.setCalories(dto.getCalories());
        recipe.setProtein(dto.getProtein());
        recipe.setCarbohydrates(dto.getCarbohydrates());
        recipe.setFats(dto.getFats());

        recipe.setRating(dto.getRating());
        recipe.setCategories(mapCategoryNames(dto.getCategories()));
    }

    /*
     * ---------------------------------------------------------
     * Entity -> Response DTO
     * ---------------------------------------------------------
     */

    public static RecipeResponseDto toResponseDto(Recipe recipe) {
        if (recipe == null) {
            return null;
        }

        RecipeResponseDto dto = new RecipeResponseDto();

        dto.setId(recipe.getId());
        dto.setTitle(recipe.getTitle());
        dto.setDescription(recipe.getDescription());
        dto.setIngredients(recipe.getIngredients());
        dto.setInstructions(recipe.getInstructions());
        dto.setImageUrl(recipe.getImageUrl());

        dto.setDifficultyLevel(
                recipe.getDifficultyLevel() != null
                        ? recipe.getDifficultyLevel().name()
                        : null);

        dto.setPrepTimeMinutes(recipe.getPrepTimeMinutes());
        dto.setCookTimeMinutes(recipe.getCookTimeMinutes());
        dto.setServings(recipe.getServings());

        dto.setCalories(recipe.getCalories());
        dto.setProtein(recipe.getProtein());
        dto.setCarbohydrates(recipe.getCarbohydrates());
        dto.setFats(recipe.getFats());

        dto.setRating(recipe.getRating());
        dto.setCategories(mapCategories(recipe.getCategories()));

        return dto;
    }

    /*
     * ---------------------------------------------------------
     * Hilfsfunktionen
     * ---------------------------------------------------------
     */

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    private static DifficultyLevel mapDifficulty(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().toUpperCase();

        return switch (normalized) {
            case "EASY", "EINFACH" -> DifficultyLevel.EASY;
            case "MEDIUM", "MITTEL" -> DifficultyLevel.MEDIUM;
            case "HARD", "SCHWIERIG" -> DifficultyLevel.HARD;
            default -> null;
        };
    }

    private static Set<Category> mapCategoryNames(List<String> names) {
        if (names == null) {
            return Set.of();
        }

        return names.stream()
                .filter(name -> name != null && !name.isBlank())
                .map(name -> new Category(name.trim()))
                .collect(Collectors.toSet());
    }

    private static List<RecipeResponseDto.CategoryDto> mapCategories(Set<Category> categories) {
        if (categories == null) {
            return List.of();
        }

        return categories.stream()
                .map(category -> new RecipeResponseDto.CategoryDto(category.getName()))
                .collect(Collectors.toList());
    }
}
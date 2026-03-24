package com.rezeptmanager.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/* =========================================================
   RecipeResponseDto
   ---------------------------------------------------------
   DTO für API-Responses.

   Zweck:
   - liefert Rezeptdaten an das Frontend
   - kapselt Entity-Struktur
   - verhindert direkte Entity-Exposition
   - ermöglicht stabile API unabhängig vom DB-Modell

   Verwendung:
   - GET /recipes
   - Scan-Preview Responses
========================================================= */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecipeResponseDto {

    /*
     * =====================================================
     * Identifikation
     * =====================================================
     */

    private Long id;

    /*
     * =====================================================
     * Basisdaten
     * =====================================================
     */

    private String title;
    private String description;
    private String ingredients;
    private String instructions;

    /*
     * =====================================================
     * Rezept-Metadaten
     * =====================================================
     */

    private String difficultyLevel;
    private Integer prepTimeMinutes;
    private Integer cookTimeMinutes;
    private Integer servings;

    /*
     * =====================================================
     * Nährwerte
     * =====================================================
     */

    private Integer calories;
    private Integer carbohydrates;
    private Integer fats;
    private Integer protein;

    /*
     * =====================================================
     * Bewertung / Bild
     * =====================================================
     */

    private Integer rating;
    private String imageUrl;

    /*
     * =====================================================
     * Kategorien
     * =====================================================
     */

    private List<CategoryDto> categories;

    /*
     * =====================================================
     * Category DTO
     * -----------------------------------------------------
     * Vereinfachte Kategorie-Repräsentation
     * für API-Responses.
     * =====================================================
     */

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryDto {

        private String name;

    }

}
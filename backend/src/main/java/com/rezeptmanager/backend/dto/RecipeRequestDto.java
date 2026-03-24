package com.rezeptmanager.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * -------------------------------------------------------------
 * RecipeRequestDto
 * -------------------------------------------------------------
 * DTO für eingehende Rezeptdaten aus dem Frontend.
 *
 * Wird für Create- und Update-Requests verwendet und hält die
 * API-Struktur getrennt von der Entity.
 * -------------------------------------------------------------
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecipeRequestDto {

    /*
     * ---------------------------------------------------------
     * Basisdaten
     * ---------------------------------------------------------
     */

    private String title;
    private String description;
    private String ingredients;
    private String instructions;
    private String imageUrl;

    /*
     * ---------------------------------------------------------
     * Rezeptdetails
     * ---------------------------------------------------------
     */

    private String difficultyLevel;
    private Integer prepTimeMinutes;
    private Integer cookTimeMinutes;
    private Integer servings;

    /*
     * ---------------------------------------------------------
     * Nährwerte
     * ---------------------------------------------------------
     */

    private Integer calories;
    private Integer protein;
    private Integer carbohydrates;
    private Integer fats;

    /*
     * ---------------------------------------------------------
     * Sonstiges
     * ---------------------------------------------------------
     */

    private Integer rating;
    private List<String> categories;
}
package com.rezeptmanager.backend.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class ParsedRecipe {

    private Long id;

    private String title;
    private String ingredients;
    private String description;
    private String rawText;
    private String imageUrl;

    private String difficultyLevel;
    private Integer preparationTime;
    private Integer cookingTime;
    private Integer servings;

    private Integer calories;
    private Integer carbohydrates;
    private Integer fats;
    private Integer protein;

    private Integer rating;

    private List<CategoryDto> categories;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class CategoryDto {
        private String name;
    }

    public ParsedRecipe(String title, String ingredients, String description) {
        this.title = title;
        this.ingredients = ingredients;
        this.description = description;
        this.rawText = title + "\n" + ingredients + "\n" + description;
        this.imageUrl = null;
        
    }


}

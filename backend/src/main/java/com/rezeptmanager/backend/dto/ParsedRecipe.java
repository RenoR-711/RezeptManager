package com.rezeptmanager.backend.dto;

public class ParsedRecipe {

    private String title;
    private String ingredients;
    private String description;

    public ParsedRecipe() {
    }

    public ParsedRecipe(String title, String ingredients, String description) {
        this.title = title;
        this.ingredients = ingredients;
        this.description = description;
    }

    public String getTitle() {
        return title;
    }

    public String getIngredients() {
        return ingredients;
    }

    public String getDescription() {
        return description;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setIngredients(String ingredients) {
        this.ingredients = ingredients;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}

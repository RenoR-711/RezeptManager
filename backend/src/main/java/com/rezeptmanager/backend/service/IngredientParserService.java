package com.rezeptmanager.backend.service;

import com.rezeptmanager.backend.dto.ParsedRecipe;
import org.springframework.stereotype.Service;

@Service
public class IngredientParserService {

    // ------------------------------------------------------------
    // HAUPTMETHODE – wird vom Controller aufgerufen
    // ------------------------------------------------------------
    public ParsedRecipe parse(String text) {
        if (text == null || text.isBlank()) {
            return new ParsedRecipe("Erkanntes Rezept", "", "", "");
        }

        String title = extractTitle(text);
        String ingredients = extractIngredientsFallback(text);
        String description = extractDescription(text, ingredients);

        return new ParsedRecipe(
                title.trim(),
                ingredients.trim(),
                description.trim(),
                ""); // instructions
    }

    // ------------------------------------------------------------
    // Titel = erste nicht-leere Zeile
    // ------------------------------------------------------------
    private String extractTitle(String text) {
        for (String line : text.split("\\R+")) {
            if (!line.isBlank()) {
                return line.trim();
            }
        }
        return "Erkanntes Rezept";
    }

    // ------------------------------------------------------------
    // Beschreibung = kompletter Text MINUS erkannte Zutaten
    // ------------------------------------------------------------
    private String extractDescription(String text, String ingredientsBlock) {
        if (ingredientsBlock == null || ingredientsBlock.isBlank()) {
            return text.trim();
        }

        String[] ingredientLines = ingredientsBlock.split("\\R+");
        String[] allLines = text.split("\\R+");

        StringBuilder description = new StringBuilder();

        for (String line : allLines) {
            String trimmed = line.trim();

            boolean isIngredient = false;

            for (String ingredient : ingredientLines) {
                if (trimmed.equalsIgnoreCase(ingredient.trim())) {
                    isIngredient = true;
                    break;
                }
            }

            boolean shouldSkip = trimmed.isBlank()
                    || isIngredientHeading(trimmed.toLowerCase())
                    || isIngredient;

            if (!shouldSkip) {
                description.append(trimmed).append("\n");
            }
        }

        return description.toString().trim();
    }

    // ------------------------------------------------------------
    // Fallback: reine Mustererkennung für Zutaten
    // ------------------------------------------------------------
    private String extractIngredientsFallback(String text) {
        StringBuilder ingredients = new StringBuilder();

        for (String line : text.split("\\R+")) {
            if (looksLikeIngredient(line)) {
                ingredients.append(line.trim()).append("\n");
            }
        }

        return ingredients.toString().trim();
    }

    // ------------------------------------------------------------
    // Muster für Zutaten-Erkennung (offline)
    // ------------------------------------------------------------
    private boolean looksLikeIngredient(String line) {
        if (line == null)
            return false;

        String normalized = line.toLowerCase().trim();

        // Leere oder extrem lange Zeilen → keine Zutaten
        if (normalized.isEmpty() || normalized.length() > 60)
            return false;

        // Kriterien für Zutaten:
        return normalized.matches("^[0-9].*") || // beginnt mit einer Zahl (200 g ...)
                normalized.matches("^[0-9/ ]+.*") || // Bruchzahlen (1/2, 1 / 4)
                normalized.startsWith("prise") ||
                normalized.startsWith("messerspitze") ||
                normalized.startsWith("schuss") ||
                normalized.startsWith("etwas") ||
                normalized.split(" ").length <= 3; // kurze Einträge ("Tomaten", "Butter", "2 Eier")
    }

    private boolean isIngredientHeading(String line) {
        return line.equals("zutaten:") ||
                line.equals("zutaten") ||
                line.equals("ingredients:") ||
                line.equals("ingredients");
    }

}

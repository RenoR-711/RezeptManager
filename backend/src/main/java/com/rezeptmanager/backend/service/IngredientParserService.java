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
            return new ParsedRecipe("Erkanntes Rezept", "", "");
        }

        String title = extractTitle(text);
        String ingredients = extractIngredientsFallback(text);
        String description = extractDescription(text, ingredients);

        return new ParsedRecipe(
                title.trim(),
                ingredients.trim(),
                description.trim());
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
        return "Rezept";
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

        StringBuilder desc = new StringBuilder();

        outer: for (String line : allLines) {
            String trimmed = line.trim();
            for (String ingr : ingredientLines) {
                if (trimmed.equalsIgnoreCase(ingr.trim())) {
                    // Diese Zeile gehört zu den Zutaten → überspringen
                    continue outer;
                }
            }
            desc.append(trimmed).append("\n");
        }

        return desc.toString().trim();
    }

    // ------------------------------------------------------------
    // Fallback: reine Mustererkennung für Zutaten
    // ------------------------------------------------------------
    private String extractIngredientsFallback(String text) {
        StringBuilder sb = new StringBuilder();

        for (String line : text.split("\\R+")) {
            if (looksLikeIngredient(line)) {
                sb.append(line.trim()).append("\n");
            }
        }

        return sb.toString();
    }

    // ------------------------------------------------------------
    // Muster für Zutaten-Erkennung (offline)
    // ------------------------------------------------------------
    private boolean looksLikeIngredient(String line) {
        if (line == null)
            return false;

        String l = line.toLowerCase().trim();

        // Leere oder extrem lange Zeilen → keine Zutaten
        if (l.isEmpty() || l.length() > 60)
            return false;

        // Kriterien für Zutaten:
        return l.matches("^[0-9].*") || // beginnt mit einer Zahl (200 g ...)
                l.matches("^[0-9/ ]+.*") || // Bruchzahlen (1/2, 1 / 4)
                l.startsWith("prise") ||
                l.startsWith("messerspitze") ||
                l.startsWith("schuss") ||
                l.startsWith("etwas") ||
                l.split(" ").length <= 3; // kurze Einträge ("Tomaten", "Butter", "2 Eier")
    }
}

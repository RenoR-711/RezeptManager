package com.rezeptmanager.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/* =========================================================
   ParsedRecipe
   ---------------------------------------------------------
   Transport-DTO für erkannte Rezeptdaten aus Scan-Prozessen.

   Wird verwendet für:
   - OCR-Scans aus Bildern
   - Text-Extraktion aus PDFs
   - Barcode-basierte Rezeptvorschläge
   - Vorschau im Frontend vor dem Speichern

   Ziel:
   - reine Datenübertragung
   - keine Persistenz-Logik
   - keine Business-Regeln
   - stabile Struktur für Frontend-Form-Mapping

   Lebenszyklus:
   Scan → ParsedRecipe → Frontend-Korrektur → Recipe speichern
========================================================= */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ParsedRecipe {

    /*
     * =====================================================
     * Basisdaten
     * =====================================================
     */

    /** Erkannter Titel des Rezepts */
    private String title;

    /** Erkannte Zutaten als Roh-Textblock */
    private String ingredients;

    /** Erkannte Beschreibung oder Kurztext */
    private String description;

    /*
     * =====================================================
     * Erweiterte Inhalte
     * =====================================================
     */

    /** Erkannte Zubereitungsschritte */
    private String instructions;

    /** Vollständig extrahierter Originaltext (Debug / Nachbearbeitung) */
    private String rawText;

    /*
     * =====================================================
     * Metadaten (optional)
     * =====================================================
     */

    /** Vorschlag für Bild-URL (z. B. aus Barcode-API) */
    private String imageUrl;

    /** Quelle des Scans (PDF, IMAGE, BARCODE etc.) */
    private String sourceType;

    /**
     * Convenience constructor for simple scan results.
     */
    public ParsedRecipe(String title, String ingredients, String description) {
        this.title = title;
        this.ingredients = ingredients;
        this.description = description;
    }

}
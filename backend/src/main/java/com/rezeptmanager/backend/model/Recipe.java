package com.rezeptmanager.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/* =========================================================
   Recipe Entity
   ---------------------------------------------------------
   Persistente Hauptentität der Anwendung.

   Repräsentiert ein vollständiges Rezept inklusive:
   - Basisdaten (Titel, Beschreibung, Zutaten)
   - Zubereitungsinformationen
   - Kategorien
   - Nährwerte
   - Bewertung
   - Scan-Metadaten
   - Bildreferenz

   Diese Entity wird verwendet für:
   - CRUD-Operationen
   - Scan-Importe
   - PDF-Export
   - Frontend-Darstellung

   Architekturhinweis:
   Scan-Ergebnisse werden zunächst als ParsedRecipe DTO
   verarbeitet und erst danach in diese Entity überführt.
========================================================= */

@Entity
@Table(name = "recipe")
@Getter
@Setter
@NoArgsConstructor
public class Recipe {

    /*
     * =====================================================
     * Primärschlüssel
     * =====================================================
     */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * =====================================================
     * Basisinformationen
     * =====================================================
     */

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String description;

    @Column(length = 5000)
    private String instructions;

    @Column(length = 5000)
    private String ingredients;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String rawText;

    /*
     * =====================================================
     * Zubereitung
     * =====================================================
     */

    /** Vorbereitungszeit in Minuten */
    private Integer prepTimeMinutes;

    /** Koch- / Backzeit in Minuten */
    private Integer cookTimeMinutes;

    /** Anzahl Portionen */
    private Integer servings;

    /*
     * =====================================================
     * Kategorien & Schwierigkeit
     * =====================================================
     */

    @ManyToMany
    @JoinTable(name = "recipe_categories", joinColumns = @JoinColumn(name = "recipe_id"), inverseJoinColumns = @JoinColumn(name = "category_id"))
    private Set<Category> categories = new HashSet<>();

    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficultyLevel;

    /*
     * =====================================================
     * Nährwerte (pro Portion)
     * =====================================================
     */

    private Integer calories;
    private Integer protein;
    private Integer carbohydrates;
    private Integer fats;

    /*
     * =====================================================
     * Bewertung
     * =====================================================
     */

    /** Bewertung von 1 bis 5 */
    private Integer rating;

    /*
     * =====================================================
     * Medien & Scan-Informationen
     * =====================================================
     */

    /** URL zum gespeicherten Rezeptbild */
    private String imageUrl;

    /** Originaldatei eines Scan-Imports (optional) */
    private String sourceFile;

    /*
     * =====================================================
     * Zeitstempel
     * =====================================================
     */

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
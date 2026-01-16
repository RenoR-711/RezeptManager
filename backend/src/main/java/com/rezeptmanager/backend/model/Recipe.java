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

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "recipe")
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String description;

    @Column(length = 5000)
    private String ingredients;

    private String sourceFile;

    @Column(name = "image_path")
    private String imagePath;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String rawText;

    @ManyToMany
    @JoinTable(name = "recipe_categories", joinColumns = @JoinColumn(name = "recipe_id"), inverseJoinColumns = @JoinColumn(name = "category_id"))
    private Set<Category> categories = new HashSet<>();

    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficultyLevel;
    private Integer protein; // in grams
    private Integer carbohydrates; // in grams
    private Integer fats; // in grams
    private Integer calories;
    private Integer rating; // 1 to 5
    private Integer preparationTime; // in minutes
    private Integer cookingTime; // in minutes
    private Integer servings;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private String imageUrl;
}

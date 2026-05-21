package com.rezeptmanager.backend.controller;

import com.rezeptmanager.backend.dto.RecipeRequestDto;
import com.rezeptmanager.backend.dto.RecipeResponseDto;
import com.rezeptmanager.backend.service.RecipeService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "http://localhost:5173")
public class RecipeController {

        private final RecipeService recipeService;

        public RecipeController(RecipeService recipeService) {
                this.recipeService = recipeService;
        }

        /*
         * ---------------------------------------------------------
         * Alle Rezepte
         * ---------------------------------------------------------
         */

        @GetMapping
        public List<RecipeResponseDto> getAllRecipes() {
                return recipeService.findAll();
        }

        /*
         * ---------------------------------------------------------
         * Einzelnes Rezept
         * ---------------------------------------------------------
         */

        @GetMapping("/{id}")
        public RecipeResponseDto getOne(@PathVariable Long id) {
                return recipeService.findById(id);
        }

        /*
         * ---------------------------------------------------------
         * Neues Rezept
         * ---------------------------------------------------------
         */

        @PostMapping
        public RecipeResponseDto create(@RequestBody RecipeRequestDto recipe) {
                return recipeService.create(recipe);
        }

        /*
         * ---------------------------------------------------------
         * Rezept aktualisieren
         * ---------------------------------------------------------
         */

        @PutMapping("/{id}")
        public RecipeResponseDto update(@PathVariable Long id, @RequestBody RecipeRequestDto recipe) {
                return recipeService.update(id, recipe);
        }

        /*
         * ---------------------------------------------------------
         * Rezept löschen
         * ---------------------------------------------------------
         */

        @DeleteMapping("/{id}")
        public void delete(@PathVariable Long id) {
                recipeService.delete(id);
        }

        /*
         * ---------------------------------------------------------
         * PDF Export
         * ---------------------------------------------------------
         */

        @GetMapping("/{id}/pdf")
        public ResponseEntity<byte[]> exportPdf(@PathVariable Long id) {
                return recipeService.exportPdf(id);
        }
}
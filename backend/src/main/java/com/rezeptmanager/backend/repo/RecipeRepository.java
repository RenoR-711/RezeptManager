package com.rezeptmanager.backend.repo;

import com.rezeptmanager.backend.model.Recipe;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findAllByOrderByTitleAsc();
}

package com.rezeptmanager.backend.service;

import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class ImageService {

    public String resolveImageUrl(String title, String existingImageUrl, Long recipeId) {
        if (existingImageUrl != null && !existingImageUrl.isBlank()) {
            return existingImageUrl;
        }

        // stabiler Seed: ID falls vorhanden, sonst Titel
        String seed = recipeId != null
                ? recipeId.toString()
                : URLEncoder.encode(title, StandardCharsets.UTF_8);

        return generatePlaceholder(seed, title);
    }

    private String generatePlaceholder(String seed, String title) {
        String text = URLEncoder.encode(title, StandardCharsets.UTF_8);
        return "https://placehold.co/800x500?text=" + text + "&seed=" + seed;
    }
}

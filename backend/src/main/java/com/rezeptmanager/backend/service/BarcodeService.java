package com.rezeptmanager.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rezeptmanager.backend.dto.ProductData;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class BarcodeService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    public BarcodeService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ProductData lookupProduct(String ean) {
        try {
            String url = "https://world.openfoodfacts.org/api/v2/product/" + ean + ".json";
            String json = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(json);

            String status = root.path("status").asText();
            if (!"1".equals(status)) {
                return new ProductData(ean, "Unbekanntes Produkt", null, null);
            }

            JsonNode product = root.path("product");
            String name = product.path("product_name").asText(null);
            String brand = product.path("brands").asText(null);
            String ingredientsText = product.path("ingredients_text").asText(null);

            return new ProductData(ean, name, brand, ingredientsText);
        } catch (Exception e) {
            return new ProductData(ean, "Fehler beim Abrufen", null, null);
        }
    }
}

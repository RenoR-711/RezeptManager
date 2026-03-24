package com.rezeptmanager.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rezeptmanager.backend.dto.ProductData;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * -------------------------------------------------------------
 * BarcodeService
 * -------------------------------------------------------------
 * Ruft Produktdaten anhand einer EAN über die Open Food Facts API ab.
 * -------------------------------------------------------------
 */
@Service
public class BarcodeService {

    private static final String OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/product/";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public BarcodeService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Lädt Produktdaten für eine EAN.
     */
    public ProductData lookupProduct(String ean) {
        if (ean == null || ean.isBlank()) {
            return new ProductData(null, "Ungültige EAN", null, null);
        }

        try {
            String url = OPEN_FOOD_FACTS_URL + ean.trim() + ".json";
            String json = restTemplate.getForObject(url, String.class);

            if (json == null || json.isBlank()) {
                return new ProductData(ean, "Keine Daten gefunden", null, null);
            }

            JsonNode root = objectMapper.readTree(json);

            if (!isProductFound(root)) {
                return new ProductData(ean, "Unbekanntes Produkt", null, null);
            }

            JsonNode product = root.path("product");

            String name = readText(product, "product_name");
            String brand = readText(product, "brands");
            String ingredientsText = readText(product, "ingredients_text");

            return new ProductData(
                    ean,
                    name != null ? name : "Unbekanntes Produkt",
                    brand,
                    ingredientsText);

        } catch (RestClientException e) {
            return new ProductData(ean, "Fehler beim API-Abruf", null, null);
        } catch (Exception e) {
            return new ProductData(ean, "Fehler beim Verarbeiten der Produktdaten", null, null);
        }
    }

    /*
     * ---------------------------------------------------------
     * Hilfsfunktionen
     * ---------------------------------------------------------
     */

    private boolean isProductFound(JsonNode root) {
        return root.path("status").asInt() == 1;
    }

    private String readText(JsonNode node, String fieldName) {
        JsonNode field = node.path(fieldName);
        return field.isMissingNode() || field.isNull() ? null : field.asText(null);
    }
}
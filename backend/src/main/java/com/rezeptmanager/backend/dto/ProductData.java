package com.rezeptmanager.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * -------------------------------------------------------------
 * ProductData
 * -------------------------------------------------------------
 * Einfache Produktdaten aus der Barcode-Abfrage.
 * -------------------------------------------------------------
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductData {

    private String ean;
    private String name;
    private String brand;
    private String ingredientsText;
}
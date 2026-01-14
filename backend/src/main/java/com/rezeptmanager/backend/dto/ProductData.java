package com.rezeptmanager.backend.dto;

public class ProductData {

    private String ean;
    private String name;
    private String brand;
    private String ingredientsText;

    public ProductData() {
    }

    public ProductData(String ean, String name, String brand, String ingredientsText) {
        this.ean = ean;
        this.name = name;
        this.brand = brand;
        this.ingredientsText = ingredientsText;
    }

    public String getEan() {
        return ean;
    }

    public void setEan(String ean) {
        this.ean = ean;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getIngredientsText() {
        return ingredientsText;
    }

    public void setIngredientsText(String ingredientsText) {
        this.ingredientsText = ingredientsText;
    }
}

package com.rezeptmanager.backend.model;

public enum DifficultyLevel {
    EASY("Einfach"),
    MEDIUM("Mittel"),
    HARD("Schwer");

    private final String label;

    DifficultyLevel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
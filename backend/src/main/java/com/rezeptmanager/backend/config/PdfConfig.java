package com.rezeptmanager.backend.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class PdfConfig {

    public static final float PAGE_MARGIN = 50f;

    public static final float TITLE_FONT_SIZE = 18f;
    public static final float HEADING_FONT_SIZE = 14f;
    public static final float BODY_FONT_SIZE = 11f;

    public static final float LINE_HEIGHT = 16f;

    public static final float IMAGE_MAX_WIDTH = 420f;
    public static final float IMAGE_MAX_HEIGHT = 220f;

    public static final String DEFAULT_FILENAME = "rezept.pdf";

    private PdfConfig() {
        // Utility class
    }
}
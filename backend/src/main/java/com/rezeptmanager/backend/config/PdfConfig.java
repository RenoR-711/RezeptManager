package com.rezeptmanager.backend.config;

import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.springframework.context.annotation.Configuration;

import java.awt.Color;

@Configuration
public class PdfConfig {

    public static final PDRectangle PAGE_SIZE = PDRectangle.A4;

    public static final float MARGIN = 50f;
    public static final float HEADER_HEIGHT = 52f;

    public static final float SECTION_TITLE_SPACING = 28f;
    public static final float SECTION_AFTER_TITLE_OFFSET = 18f;
    public static final float DEFAULT_VERTICAL_SPACER = 10f;

    public static final float BODY_FONT_SIZE = 11f;
    public static final float BODY_LEADING = 14f;
    public static final float SECTION_TITLE_FONT_SIZE = 13f;
    public static final float HEADER_TITLE_FONT_SIZE = 18f;

    public static final float IMAGE_MAX_WIDTH = 300f;
    public static final float IMAGE_MAX_HEIGHT = 180f;
    public static final float IMAGE_BLOCK_SPACING = 14f;

    public static final Color COLOR_HEADER_BG = new Color(245, 246, 248);
    public static final Color COLOR_LINE = new Color(220, 224, 230);
    public static final Color COLOR_TEXT = new Color(30, 30, 30);
    public static final Color COLOR_SUBTEXT = new Color(90, 90, 90);

    public static final String UPLOADS_DIR = "uploads";
    public static final String FALLBACK_CLASSPATH = "/pdf/fallback-recipe.jpg";

    private PdfConfig() {
        // Utility class
    }
}
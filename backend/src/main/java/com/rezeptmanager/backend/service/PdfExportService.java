package com.rezeptmanager.backend.service;

import com.rezeptmanager.backend.model.Recipe;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static com.rezeptmanager.backend.config.PdfConfig.*;
@Service
public class PdfExportService {

    private static final float CONTENT_TOP = PAGE_SIZE.getHeight() - HEADER_HEIGHT - 20f;

    private static final float CONTENT_BOTTOM = MARGIN;

   /*
     * =========================================================
     * ÖFFENTLICHE API
     * =========================================================
     */

    /**
     * Erstellt ein PDF für ein Rezept.
     * Enthalten sind:
     * - Header mit Titel
     * - Rezeptbild (Upload oder Fallback)
     * - Zutaten
     * - Beschreibung
     */

    public byte[] exportRecipeToPdf(Recipe recipe) {
        try (PDDocument document = new PDDocument()) {
            String recipeTitle = safeTitle(recipe);
            PageContext pageContext = createNewPage(document, recipeTitle);

            pageContext = drawRecipeImage(document, pageContext, recipe);
            pageContext = drawSectionTitle(document, pageContext, "Zutaten");
            pageContext = drawMultilineText(document, pageContext, nullSafe(recipe.getIngredients()));

            pageContext = addVerticalSpace(pageContext, DEFAULT_VERTICAL_SPACER);

            pageContext = drawSectionTitle(document, pageContext, "Beschreibung");
            pageContext = drawMultilineText(document, pageContext, nullSafe(recipe.getDescription()));

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.save(outputStream);
            return outputStream.toByteArray();

        } catch (IOException exception) {
            throw new RuntimeException("PDF-Erstellung fehlgeschlagen", exception);
        }
    }

    /*
     * =========================================================
     * SEITENAUFBAU
     * =========================================================
     */

    /**
     * Erstellt eine neue PDF-Seite inklusive Header.
     */
    private PageContext createNewPage(PDDocument document, String headerTitle) throws IOException {
        PDPage page = new PDPage(PAGE_SIZE);
        document.addPage(page);

        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            drawHeader(contentStream, headerTitle);
        }

        return new PageContext(page, CONTENT_TOP, headerTitle);
    }

    /**
     * Zeichnet den Kopfbereich der Seite.
     */
    private void drawHeader(PDPageContentStream contentStream, String title) throws IOException {
        float pageWidth = PAGE_SIZE.getWidth();
        float pageHeight = PAGE_SIZE.getHeight();
        float headerBottomY = pageHeight - HEADER_HEIGHT;

        // Header-Hintergrund
        contentStream.setNonStrokingColor(COLOR_HEADER_BG);
        contentStream.addRect(0, headerBottomY, pageWidth, HEADER_HEIGHT);
        contentStream.fill();

        // Untere Header-Linie
        contentStream.setStrokingColor(COLOR_LINE);
        contentStream.setLineWidth(1f);
        contentStream.moveTo(0, headerBottomY);
        contentStream.lineTo(pageWidth, headerBottomY);
        contentStream.stroke();

        // Titel
        contentStream.setNonStrokingColor(COLOR_TEXT);
        writeText(
                contentStream,
                PDType1Font.HELVETICA_BOLD,
                HEADER_TITLE_FONT_SIZE,
                MARGIN,
                pageHeight - 34,
                title);
    }

    /*
     * =========================================================
     * BILD-RENDERING
     * =========================================================
     */

    /**
     * Zeichnet das Rezeptbild. Verwendet zuerst ein hochgeladenes Bild,
     * andernfalls ein Fallback-Bild aus den Ressourcen.
     */
    private PageContext drawRecipeImage(PDDocument document, PageContext context, Recipe recipe) throws IOException {
        PDImageXObject image = loadRecipeImage(document, recipe);

        if (image == null) {
            return context;
        }

        float requiredHeight = IMAGE_MAX_HEIGHT + IMAGE_BLOCK_SPACING;
        context = ensureSpace(document, context, requiredHeight);

        float originalWidth = image.getWidth();
        float originalHeight = image.getHeight();
        float scale = Math.min(IMAGE_MAX_WIDTH / originalWidth, IMAGE_MAX_HEIGHT / originalHeight);

        float drawWidth = originalWidth * scale;
        float drawHeight = originalHeight * scale;

        float x = MARGIN;
        float y = context.y - drawHeight;

        try (PDPageContentStream contentStream = new PDPageContentStream(
                document,
                context.page,
                PDPageContentStream.AppendMode.APPEND,
                true)) {
            // Rahmen
            contentStream.setStrokingColor(COLOR_LINE);
            contentStream.setLineWidth(1f);
            contentStream.addRect(x - 6, y - 6, drawWidth + 12, drawHeight + 12);
            contentStream.stroke();

            // Bild
            contentStream.drawImage(image, x, y, drawWidth, drawHeight);

            // Trennlinie
            float lineY = y - 12;
            contentStream.setStrokingColor(COLOR_LINE);
            contentStream.setLineWidth(1f);
            contentStream.moveTo(MARGIN, lineY);
            contentStream.lineTo(PAGE_SIZE.getWidth() - MARGIN, lineY);
            contentStream.stroke();
        }

        context.y = y - 24;
        return context;
    }

    /**
     * Lädt das Rezeptbild aus dem Upload-Verzeichnis oder aus den Ressourcen.
     */
    private PDImageXObject loadRecipeImage(PDDocument document, Recipe recipe) throws IOException {
        String sourceFile = recipe.getSourceFile();

        // 1) Bild aus Uploads
        if (sourceFile != null && !sourceFile.isBlank()) {
            Path imagePath = Paths.get(UPLOADS_DIR, sourceFile);
            if (Files.exists(imagePath)) {
                return PDImageXObject.createFromFile(imagePath.toString(), document);
            }
        }

        // 2) Fallback-Bild aus resources
        try (InputStream inputStream = getClass().getResourceAsStream(FALLBACK_CLASSPATH)) {
            if (inputStream == null) {
                return null;
            }

            byte[] imageBytes = inputStream.readAllBytes();
            return PDImageXObject.createFromByteArray(document, imageBytes, "fallback-recipe-image");
        }
    }

    /*
     * =========================================================
     * SEKTIONEN / TEXT
     * =========================================================
     */

    /**
     * Zeichnet eine Sektionsüberschrift mit Trennlinie.
     */
    private PageContext drawSectionTitle(PDDocument document, PageContext context, String title) throws IOException {
        context = ensureSpace(document, context, SECTION_TITLE_SPACING);

        try (PDPageContentStream contentStream = new PDPageContentStream(
                document,
                context.page,
                PDPageContentStream.AppendMode.APPEND,
                true)) {
            contentStream.setNonStrokingColor(COLOR_TEXT);
            writeText(
                    contentStream,
                    PDType1Font.HELVETICA_BOLD,
                    SECTION_TITLE_FONT_SIZE,
                    MARGIN,
                    context.y,
                    title);

            float lineY = context.y - 6;
            contentStream.setStrokingColor(COLOR_LINE);
            contentStream.setLineWidth(1f);
            contentStream.moveTo(MARGIN, lineY);
            contentStream.lineTo(PAGE_SIZE.getWidth() - MARGIN, lineY);
            contentStream.stroke();
        }

        context.y -= SECTION_AFTER_TITLE_OFFSET;
        return context;
    }

    /**
     * Zeichnet mehrzeiligen Fließtext mit automatischem Zeilenumbruch
     * und Seitenumbruch bei Platzmangel.
     */
    private PageContext drawMultilineText(PDDocument document, PageContext context, String text) throws IOException {
        float maxWidth = PAGE_SIZE.getWidth() - (2 * MARGIN);
        String[] paragraphs = text.split("\\R");

        for (String paragraph : paragraphs) {
            // Leerzeile
            if (paragraph.trim().isEmpty()) {
                context = ensureSpace(document, context, BODY_LEADING);
                context.y -= BODY_LEADING;
                continue;
            }

            String[] wrappedLines = wrapLine(paragraph, PDType1Font.HELVETICA, BODY_FONT_SIZE, maxWidth);

            for (String line : wrappedLines) {
                context = ensureSpace(document, context, BODY_LEADING);

                try (PDPageContentStream contentStream = new PDPageContentStream(
                        document,
                        context.page,
                        PDPageContentStream.AppendMode.APPEND,
                        true)) {
                    contentStream.setNonStrokingColor(COLOR_SUBTEXT);
                    writeText(
                            contentStream,
                            PDType1Font.HELVETICA,
                            BODY_FONT_SIZE,
                            MARGIN,
                            context.y,
                            line);
                }

                context.y -= BODY_LEADING;
            }
        }

        return context;
    }

    /**
     * Fügt vertikalen Abstand hinzu.
     */
    private PageContext addVerticalSpace(PageContext context, float spacing) {
        context.y -= spacing;
        return context;
    }

    /**
     * Prüft, ob auf der aktuellen Seite noch genug Platz vorhanden ist.
     * Falls nicht, wird automatisch eine neue Seite erzeugt.
     */
    private PageContext ensureSpace(PDDocument document, PageContext context, float requiredHeight) throws IOException {
        if (context.y - requiredHeight < CONTENT_BOTTOM) {
            return createNewPage(document, context.headerTitle);
        }
        return context;
    }

    /*
     * =========================================================
     * TEXT-HELPER
     * =========================================================
     */

    /**
     * Schreibt eine einzelne Textzeile an eine feste Position.
     */
    private void writeText(
            PDPageContentStream contentStream,
            PDType1Font font,
            float fontSize,
            float x,
            float y,
            String text) throws IOException {
        contentStream.beginText();
        contentStream.setFont(font, fontSize);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(sanitize(text));
        contentStream.endText();
    }

    /**
     * Führt einen einfachen Wortumbruch anhand der maximalen Zeilenbreite aus.
     */
    private String[] wrapLine(String text, PDType1Font font, float fontSize, float maxWidth) throws IOException {
        String[] words = text.split("\\s+");
        StringBuilder currentLine = new StringBuilder();
        java.util.List<String> lines = new java.util.ArrayList<>();

        for (String word : words) {
            String candidate = currentLine.length() == 0
                    ? word
                    : currentLine + " " + word;

            float candidateWidth = font.getStringWidth(candidate) / 1000f * fontSize;

            if (candidateWidth <= maxWidth) {
                currentLine.setLength(0);
                currentLine.append(candidate);
            } else {
                if (currentLine.length() > 0) {
                    lines.add(currentLine.toString());
                }
                currentLine.setLength(0);
                currentLine.append(word);
            }
        }

        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }

        return lines.toArray(new String[0]);
    }

    /**
     * Entfernt problematische Steuerzeichen für PDFBox.
     */
    private String sanitize(String text) {
        if (text == null) {
            return "";
        }

        return text.replaceAll("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]", "");
    }

    /**
     * Verhindert Null-Werte und trimmt Strings.
     */
    private String nullSafe(String value) {
        return value == null ? "" : value.trim();
    }

    /**
     * Liefert einen sicheren PDF-Titel.
     */
    private String safeTitle(Recipe recipe) {
        String title = recipe == null ? null : recipe.getTitle();
        return (title == null || title.isBlank()) ? "Rezept" : title.trim();
    }

    /*
     * =========================================================
     * KONTEXTKLASSE FÜR DIE AKTUELLE SEITE
     * =========================================================
     */

    /**
     * Hält den aktuellen Seitenzustand während des PDF-Aufbaus.
     */
    private static class PageContext {
        private final PDPage page;
        private float y;
        private final String headerTitle;

        private PageContext(PDPage page, float y, String headerTitle) {
            this.page = page;
            this.y = y;
            this.headerTitle = headerTitle;
        }
    }
}
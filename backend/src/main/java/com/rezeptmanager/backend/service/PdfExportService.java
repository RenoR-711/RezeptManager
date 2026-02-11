package com.rezeptmanager.backend.service;

import com.rezeptmanager.backend.model.Recipe;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class PdfExportService {

    // Layout-Konstanten
    private static final PDRectangle PAGE_SIZE = PDRectangle.A4;
    private static final float MARGIN = 50f;
    private static final float HEADER_H = 52f;
    private static final float GUTTER = 14f;

    private static final float CONTENT_TOP = PAGE_SIZE.getHeight() - MARGIN - HEADER_H; // Start unter Header
    private static final float CONTENT_BOTTOM = MARGIN; // Unterkante

    // Bild
    private static final float IMAGE_MAX_W = 300f;
    private static final float IMAGE_MAX_H = 180f;

    // Farben (dezentes Layout)
    private static final Color COLOR_HEADER_BG = new Color(245, 246, 248);
    private static final Color COLOR_LINE = new Color(220, 224, 230);
    private static final Color COLOR_TEXT = new Color(30, 30, 30);
    private static final Color COLOR_SUB = new Color(90, 90, 90);

    // Pfade
    private static final String UPLOADS_DIR = "uploads"; // bei dir ggf. "uploads/images"
    private static final String FALLBACK_CLASSPATH = "/pdf/fallback-recipe.jpg";

    public byte[] exportRecipeToPdf(Recipe recipe) {
        try (PDDocument doc = new PDDocument()) {
            PageCtx ctx = newPage(doc, safeTitle(recipe));

            // --- Bild (Upload oder Fallback) ---
            ctx = drawRecipeImage(doc, ctx, recipe);

            // --- Sections ---
            ctx = drawSectionTitle(doc, ctx, "Zutaten");
            ctx = drawMultilineText(doc, ctx, nullSafe(recipe.getIngredients()));

            ctx = addVerticalSpace(ctx, 10);

            ctx = drawSectionTitle(doc, ctx, "Beschreibung");
            ctx = drawMultilineText(doc, ctx, nullSafe(recipe.getDescription()));

            // optional: rawText
            // ctx = addVerticalSpace(ctx, 10);
            // ctx = drawSectionTitle(doc, ctx, "Notizen");
            // ctx = drawMultilineText(doc, ctx, nullSafe(recipe.getRawText()));

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("PDF-Erstellung fehlgeschlagen", e);
        }
    }

    /*
     * =========================
     * Page + Header
     * =========================
     */

    private PageCtx newPage(PDDocument doc, String title) throws IOException {
        PDPage page = new PDPage(PAGE_SIZE);
        doc.addPage(page);

        PDPageContentStream cs = new PDPageContentStream(doc, page);
        // Header Hintergrund
        cs.setNonStrokingColor(COLOR_HEADER_BG);
        cs.addRect(0, PAGE_SIZE.getHeight() - HEADER_H, PAGE_SIZE.getWidth(), HEADER_H);
        cs.fill();

        // Header Linie unten
        cs.setStrokingColor(COLOR_LINE);
        cs.setLineWidth(1f);
        cs.moveTo(0, PAGE_SIZE.getHeight() - HEADER_H);
        cs.lineTo(PAGE_SIZE.getWidth(), PAGE_SIZE.getHeight() - HEADER_H);
        cs.stroke();

        // Titel im Header
        cs.setNonStrokingColor(COLOR_TEXT);
        writeText(cs, PDType1Font.HELVETICA_BOLD, 18,
                MARGIN, PAGE_SIZE.getHeight() - 34, title);

        // Kleine Subtitle (optional)
        // writeText(cs, PDType1Font.HELVETICA, 10, MARGIN, PAGE_SIZE.getHeight() - 46,
        // "RezeptManager Export");

        cs.close();

        return new PageCtx(page, CONTENT_TOP);
    }

    /*
     * =========================
     * Image (Upload + Fallback)
     * =========================
     */

    private PageCtx drawRecipeImage(PDDocument doc, PageCtx ctx, Recipe recipe) throws IOException {
        PDImageXObject img = loadRecipeImage(doc, recipe);

        if (img == null) {
            return ctx; // zur Sicherheit
        }

        // Platz prüfen + ggf. neue Seite
        float needed = IMAGE_MAX_H + 14f;
        ctx = ensureSpace(doc, ctx, needed, safeTitle(recipe));

        // Skalierung proportional in maxW/maxH
        float iw = img.getWidth();
        float ih = img.getHeight();
        float scale = Math.min(IMAGE_MAX_W / iw, IMAGE_MAX_H / ih);

        float drawW = iw * scale;
        float drawH = ih * scale;

        float x = MARGIN;
        float yTop = ctx.y; // ctx.y ist "aktueller Top-Anchor"
        float y = yTop - drawH;

        try (PDPageContentStream cs = new PDPageContentStream(doc, ctx.page, PDPageContentStream.AppendMode.APPEND,
                true)) {

            // Rahmen (Card-Look)
            cs.setStrokingColor(COLOR_LINE);
            cs.setLineWidth(1f);
            cs.addRect(x - 6, y - 6, drawW + 12, drawH + 12);
            cs.stroke();

            cs.drawImage(img, x, y, drawW, drawH);

            // Trennlinie unter Bild
            float lineY = y - 12;
            cs.setStrokingColor(COLOR_LINE);
            cs.setLineWidth(1f);
            cs.moveTo(MARGIN, lineY);
            cs.lineTo(PAGE_SIZE.getWidth() - MARGIN, lineY);
            cs.stroke();
        }

        ctx.y = y - 24; // unter Bild + Abstand
        return ctx;
    }

    private PDImageXObject loadRecipeImage(PDDocument doc, Recipe recipe) throws IOException {
        // 1) Upload-Datei
        String sf = recipe.getSourceFile();
        if (sf != null && !sf.isBlank()) {
            Path p = Paths.get(UPLOADS_DIR, sf);
            if (Files.exists(p)) {
                return PDImageXObject.createFromFile(p.toString(), doc);
            }
        }

        // 2) Fallback aus resources
        try (InputStream is = getClass().getResourceAsStream(FALLBACK_CLASSPATH)) {
            if (is == null)
                return null;
            byte[] bytes = is.readAllBytes();
            return PDImageXObject.createFromByteArray(doc, bytes, "fallback");
        }
    }

    /*
     * =========================
     * Sections + Text + Pagebreak
     * =========================
     */

    private PageCtx drawSectionTitle(PDDocument doc, PageCtx ctx, String title) throws IOException {
        // Höhe für Titel + Linie
        ctx = ensureSpace(doc, ctx, 28f, ctx.headerTitle);

        try (PDPageContentStream cs = new PDPageContentStream(doc, ctx.page, PDPageContentStream.AppendMode.APPEND,
                true)) {
            cs.setNonStrokingColor(COLOR_TEXT);
            writeText(cs, PDType1Font.HELVETICA_BOLD, 13, MARGIN, ctx.y, title);

            // dünne Linie rechts daneben (optischer Akzent)
            float lineY = ctx.y - 6;
            cs.setStrokingColor(COLOR_LINE);
            cs.setLineWidth(1f);
            cs.moveTo(MARGIN, lineY);
            cs.lineTo(PAGE_SIZE.getWidth() - MARGIN, lineY);
            cs.stroke();
        }

        ctx.y -= 18f;
        return ctx;
    }

    private PageCtx drawMultilineText(PDDocument doc, PageCtx ctx, String text) throws IOException {
        // Basic Wrap (für HELVETICA 11)
        final float fontSize = 11f;
        final float leading = 14f;
        final float maxWidth = PAGE_SIZE.getWidth() - 2 * MARGIN;

        String[] paragraphs = text.split("\\R"); // \n oder \r\n
        for (String para : paragraphs) {
            // leere Zeile -> Abstand
            if (para.trim().isEmpty()) {
                ctx = ensureSpace(doc, ctx, leading, ctx.headerTitle);
                ctx.y -= leading;
                continue;
            }

            for (String line : wrapLine(para, PDType1Font.HELVETICA, fontSize, maxWidth)) {
                ctx = ensureSpace(doc, ctx, leading, ctx.headerTitle);

                try (PDPageContentStream cs = new PDPageContentStream(doc, ctx.page,
                        PDPageContentStream.AppendMode.APPEND, true)) {
                    cs.setNonStrokingColor(COLOR_SUB);
                    writeText(cs, PDType1Font.HELVETICA, fontSize, MARGIN, ctx.y, line);
                }

                ctx.y -= leading;
            }
        }

        return ctx;
    }

    private PageCtx ensureSpace(PDDocument doc, PageCtx ctx, float neededHeight, String titleForHeader)
            throws IOException {
        if (ctx.y - neededHeight < CONTENT_BOTTOM) {
            // neue Seite
            return newPage(doc, titleForHeader);
        }
        return ctx;
    }

    private PageCtx addVerticalSpace(PageCtx ctx, float space) {
        ctx.y -= space;
        return ctx;
    }

    /*
     * =========================
     * Text helpers
     * =========================
     */

    private void writeText(PDPageContentStream cs,
            PDType1Font font,
            float fontSize,
            float x, float y,
            String text) throws IOException {
        cs.beginText();
        cs.setFont(font, fontSize);
        cs.newLineAtOffset(x, y);
        cs.showText(sanitize(text));
        cs.endText();
    }

    private String[] wrapLine(String text, PDType1Font font, float fontSize, float maxWidth) throws IOException {
        // einfache Wort-Umbruch-Logik
        String[] words = text.split("\\s+");
        StringBuilder line = new StringBuilder();
        java.util.List<String> lines = new java.util.ArrayList<>();

        for (String w : words) {
            String candidate = line.length() == 0 ? w : line + " " + w;
            float width = font.getStringWidth(candidate) / 1000f * fontSize;

            if (width <= maxWidth) {
                line.setLength(0);
                line.append(candidate);
            } else {
                if (line.length() > 0)
                    lines.add(line.toString());
                line.setLength(0);
                line.append(w);
            }
        }
        if (line.length() > 0)
            lines.add(line.toString());

        return lines.toArray(new String[0]);
    }

    private String nullSafe(String s) {
        return s == null ? "" : s.trim();
    }

    private String safeTitle(Recipe r) {
        String t = (r == null ? null : r.getTitle());
        if (t == null || t.isBlank())
            return "Rezept";
        return t.trim();
    }

    // PDFBox mag keine Steuerzeichen; außerdem Anführungszeichen/Unicode kann man
    // erstmal drin lassen
    private String sanitize(String s) {
        if (s == null)
            return "";
        return s.replaceAll("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]", "");
    }

    /*
     * =========================
     * Page context holder
     * =========================
     */

    private static class PageCtx {
        PDPage page;
        float y;
        String headerTitle;

        PageCtx(PDPage page, float y) {
            this.page = page;
            this.y = y;
            this.headerTitle = "Rezept";
        }
    }
}

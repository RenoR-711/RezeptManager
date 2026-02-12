package com.rezeptmanager.backend.service;

import com.rezeptmanager.backend.exception.TextExtractionException;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;

@Service
public class TextExtractorService {

    private final String tessDataPath;
    private final String language;
    private final int pdfDpi;

    public TextExtractorService(
            @Value("${app.ocr.data-path:}") String tessDataPath,
            @Value("${app.ocr.languages:deu+eng}") String language,
            @Value("${app.ocr.pdf.dpi:300}") int pdfDpi) {
        this.tessDataPath = tessDataPath;
        this.language = language;
        this.pdfDpi = pdfDpi;
    }

    // -------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------

    /**
     * Auto: Text-PDF -> direkt extrahieren, Scan-PDF -> OCR über gerenderte Seiten
     */
    public String extractTextFromPdf(MultipartFile pdfFile) {
        if (pdfFile == null || pdfFile.isEmpty()) {
            throw new TextExtractionException("PDF file is empty.");
        }

        try (InputStream in = pdfFile.getInputStream();
                PDDocument doc = PDDocument.load(in)) {

            // 1) Versuch: echten Text extrahieren
            String directText = extractTextDirect(doc);

            // Heuristik: wenn genügend Text vorhanden ist -> Text-PDF
            if (looksLikeRealText(directText)) {
                return normalize(directText);
            }

            // 2) Sonst: Scan-PDF -> rendern + OCR pro Seite
            String ocrText = ocrPdfByRendering(doc);

            if (ocrText == null || ocrText.isBlank()) {
                throw new TextExtractionException(
                        "OCR returned empty text. Check image quality or Tesseract configuration.");
            }

            return normalize(ocrText);

        } catch (IOException e) {
            throw new TextExtractionException("Could not read PDF.", e);
        }
    }

    /** jpg/png -> OCR */
    public String extractTextFromImage(MultipartFile imageFile) {
        if (imageFile == null || imageFile.isEmpty()) {
            throw new TextExtractionException("Image file is empty.");
        }

        try {
            BufferedImage input = ImageIO.read(imageFile.getInputStream());
            if (input == null) {
                throw new TextExtractionException("Unsupported image format (ImageIO returned null).");
            }

            BufferedImage pre = preprocessForOcr(input);

            String text = getTesseract().doOCR(pre);

            if (text == null || text.isBlank()) {
                throw new TextExtractionException("OCR returned empty text. Try a sharper image / better contrast.");
            }

            return normalize(text);

        } catch (IOException e) {
            throw new TextExtractionException("Could not read image.", e);
        } catch (TesseractException e) {
            throw new TextExtractionException("OCR failed (Tesseract).", e);
        }
    }

    // -------------------------------------------------------------
    // PDF: direct text
    // -------------------------------------------------------------
    private String extractTextDirect(PDDocument doc) {
        try {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(doc);
        } catch (IOException e) {
            // falls TextStripper aus irgendeinem Grund scheitert -> lieber OCR versuchen
            return "";
        }
    }

    private boolean looksLikeRealText(String text) {
        if (text == null)
            return false;

        String t = text.trim();
        if (t.length() < 60)
            return false; // sehr kurz -> wahrscheinlich nicht
        // wenn sehr viele “komische” Zeichen: eher nicht
        long letters = t.chars().filter(Character::isLetterOrDigit).count();
        double ratio = (t.length() == 0) ? 0 : (letters * 1.0 / t.length());
        return ratio > 0.45; // grobe Heuristik
    }

    // -------------------------------------------------------------
    // PDF: OCR by rendering pages
    // -------------------------------------------------------------
    private String ocrPdfByRendering(PDDocument doc) {
        try {
            PDFRenderer renderer = new PDFRenderer(doc);

            StringBuilder sb = new StringBuilder(4096);
            ITesseract tess = getTesseract();

            int pages = doc.getNumberOfPages();
            for (int i = 0; i < pages; i++) {
                // render page -> image
                BufferedImage pageImg = renderer.renderImageWithDPI(i, pdfDpi, ImageType.RGB);

                // preprocess
                BufferedImage pre = preprocessForOcr(pageImg);

                String pageText = tess.doOCR(pre);
                if (pageText != null && !pageText.isBlank()) {
                    sb.append(pageText.trim()).append("\n\n");
                }
            }

            return sb.toString();

        } catch (TesseractException e) {
            throw new TextExtractionException("OCR failed while processing PDF pages.", e);
        } catch (IOException e) {
            throw new TextExtractionException("Rendering PDF pages failed.", e);
        }
    }

    // -------------------------------------------------------------
    // Tesseract init
    // -------------------------------------------------------------
    private ITesseract getTesseract() {
        Tesseract t = new Tesseract();

        if (tessDataPath == null || tessDataPath.isBlank()) {
            // tess4j kann manchmal ohne datapath laufen, aber auf Windows ist es oft die
            // Fehlerquelle
            throw new TextExtractionException(
                    "Tesseract datapath is not configured. Set app.ocr.datapath in application.properties.");
        }

        // datapath muss auf tessdata zeigen (wo deu.traineddata liegt)
        t.setDatapath(tessDataPath);
        t.setLanguage(language);

        return t;
    }

    // -------------------------------------------------------------
    // Preprocessing (simpel aber effektiv)
    // -------------------------------------------------------------
    private BufferedImage preprocessForOcr(BufferedImage src) {
        // 1) ggf. leicht hochskalieren (hilft bei kleinem Text)
        BufferedImage scaled = scale(src, 2.0);

        // 2) grayscale
        BufferedImage gray = new BufferedImage(scaled.getWidth(), scaled.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = gray.createGraphics();
        g.drawImage(scaled, 0, 0, null);
        g.dispose();

        // 3) binarize (Kontrast)
        BufferedImage bw = new BufferedImage(gray.getWidth(), gray.getHeight(), BufferedImage.TYPE_BYTE_BINARY);
        Graphics2D g2 = bw.createGraphics();
        g2.drawImage(gray, 0, 0, null);
        g2.dispose();

        return bw;
    }

    private BufferedImage scale(BufferedImage src, double factor) {
        int w = (int) Math.round(src.getWidth() * factor);
        int h = (int) Math.round(src.getHeight() * factor);

        BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.drawImage(src, 0, 0, w, h, null);
        g.dispose();
        return out;
    }

    private String normalize(String text) {
        String t = text == null ? "" : text;
        // sanft normalisieren
        t = t.replace("\r\n", "\n").replace("\r", "\n");
        // überflüssige Leerzeilen reduzieren
        t = t.replaceAll("\n{3,}", "\n\n");
        return t.trim();
    }
}

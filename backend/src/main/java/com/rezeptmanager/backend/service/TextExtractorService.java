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
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;

@Service
public class TextExtractorService {

    /*
     * -------------------------------------------------------------
     * Konfiguration
     * -------------------------------------------------------------
     */

    private static final int MIN_DIRECT_TEXT_LENGTH = 60;
    private static final double MIN_TEXT_RATIO = 0.45;
    private static final double OCR_SCALE_FACTOR = 2.0;

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

    /*
     * -------------------------------------------------------------
     * Public API
     * -------------------------------------------------------------
     */

    /**
     * Extrahiert Text aus einer PDF-Datei.
     *
     * Ablauf:
     * 1. Versuch, direkt eingebetteten Text aus der PDF zu lesen
     * 2. Falls kaum sinnvoller Text gefunden wird, OCR über gerenderte PDF-Seiten
     */
    public String extractTextFromPdf(MultipartFile pdfFile) {
        validateUploadedFile(pdfFile, "PDF file is empty.");

        try (InputStream inputStream = pdfFile.getInputStream();
                PDDocument document = PDDocument.load(inputStream)) {

            String directText = extractDirectTextFromPdf(document);

            if (containsUsableDirectText(directText)) {
                return normalizeText(directText);
            }

            String ocrText = extractTextFromRenderedPdfPages(document);

            if (ocrText == null || ocrText.isBlank()) {
                throw new TextExtractionException(
                        "OCR returned empty text. Check image quality or Tesseract configuration.");
            }

            return normalizeText(ocrText);

        } catch (IOException e) {
            throw new TextExtractionException("Could not read PDF.", e);
        }
    }

    /**
     * Extrahiert Text aus einer Bilddatei per OCR.
     */
    public String extractTextFromImage(MultipartFile imageFile) {
        validateUploadedFile(imageFile, "Image file is empty.");

        try (InputStream inputStream = imageFile.getInputStream()) {
            BufferedImage sourceImage = ImageIO.read(inputStream);

            if (sourceImage == null) {
                throw new TextExtractionException("Unsupported image format (ImageIO returned null).");
            }

            BufferedImage processedImage = preprocessImageForOcr(sourceImage);
            String extractedText = createTesseract().doOCR(processedImage);

            if (extractedText == null || extractedText.isBlank()) {
                throw new TextExtractionException(
                        "OCR returned empty text. Try a sharper image / better contrast.");
            }

            return normalizeText(extractedText);

        } catch (IOException e) {
            throw new TextExtractionException("Could not read image.", e);
        } catch (TesseractException e) {
            throw new TextExtractionException("OCR failed (Tesseract).", e);
        }
    }

    /*
     * -------------------------------------------------------------
     * PDF: direkte Textextraktion
     * -------------------------------------------------------------
     */

    /**
     * Liest direkt eingebetteten Text aus einer PDF.
     * Falls das fehlschlägt, wird ein leerer String zurückgegeben,
     * damit anschließend OCR als Fallback genutzt werden kann.
     */
    private String extractDirectTextFromPdf(PDDocument document) {
        try {
            PDFTextStripper textStripper = new PDFTextStripper();
            textStripper.setSortByPosition(true);
            return textStripper.getText(document);
        } catch (IOException e) {
            return "";
        }
    }

    /**
     * Prüft heuristisch, ob der extrahierte PDF-Text wahrscheinlich
     * echter, brauchbarer Text ist und nicht nur Artefakte oder Rauschen.
     */
    private boolean containsUsableDirectText(String text) {
        if (text == null) {
            return false;
        }

        String trimmedText = text.trim();
        if (trimmedText.length() < MIN_DIRECT_TEXT_LENGTH) {
            return false;
        }

        long letterOrDigitCount = trimmedText.chars()
                .filter(Character::isLetterOrDigit)
                .count();

        double ratio = trimmedText.isEmpty()
                ? 0
                : (letterOrDigitCount * 1.0 / trimmedText.length());

        return ratio > MIN_TEXT_RATIO;
    }

    /*
     * -------------------------------------------------------------
     * PDF: OCR über gerenderte Seiten
     * -------------------------------------------------------------
     */

    /**
     * Rendert jede PDF-Seite als Bild und führt anschließend OCR darüber aus.
     */
    private String extractTextFromRenderedPdfPages(PDDocument document) {
        try {
            PDFRenderer pdfRenderer = new PDFRenderer(document);
            ITesseract tesseract = createTesseract();

            StringBuilder extractedText = new StringBuilder(4096);
            int pageCount = document.getNumberOfPages();

            for (int pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                BufferedImage pageImage = pdfRenderer.renderImageWithDPI(pageIndex, pdfDpi, ImageType.RGB);
                BufferedImage processedPageImage = preprocessImageForOcr(pageImage);

                String pageText = tesseract.doOCR(processedPageImage);

                if (pageText != null && !pageText.isBlank()) {
                    extractedText.append(pageText.trim()).append("\n\n");
                }
            }

            return extractedText.toString();

        } catch (TesseractException e) {
            throw new TextExtractionException("OCR failed while processing PDF pages.", e);
        } catch (IOException e) {
            throw new TextExtractionException("Rendering PDF pages failed.", e);
        }
    }

    /*
     * -------------------------------------------------------------
     * Tesseract-Konfiguration
     * -------------------------------------------------------------
     */

    /**
     * Erstellt eine konfigurierte Tesseract-Instanz.
     *
     * Hinweis:
     * Der Pfad muss auf den Ordner zeigen, in dem sich die
     * Sprachdateien wie deu.traineddata oder eng.traineddata befinden.
     */
    private ITesseract createTesseract() {
        if (tessDataPath == null || tessDataPath.isBlank()) {
            throw new TextExtractionException(
                    "Tesseract datapath is not configured. Set app.ocr.data-path to your tessdata folder in application.properties.");
        }

        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath(tessDataPath);
        tesseract.setLanguage(language);

        return tesseract;
    }

    /*
     * -------------------------------------------------------------
     * Bildvorverarbeitung für OCR
     * -------------------------------------------------------------
     */

    /**
     * Bereitet ein Bild für OCR vor:
     * 1. Hochskalieren für kleine Schrift
     * 2. Umwandlung in Graustufen
     * 3. Binarisierung für stärkeren Kontrast
     */
    private BufferedImage preprocessImageForOcr(BufferedImage sourceImage) {
        BufferedImage scaledImage = scaleImage(sourceImage, OCR_SCALE_FACTOR);

        BufferedImage grayscaleImage = new BufferedImage(
                scaledImage.getWidth(),
                scaledImage.getHeight(),
                BufferedImage.TYPE_BYTE_GRAY);

        Graphics2D grayscaleGraphics = grayscaleImage.createGraphics();
        grayscaleGraphics.drawImage(scaledImage, 0, 0, null);
        grayscaleGraphics.dispose();

        BufferedImage binaryImage = new BufferedImage(
                grayscaleImage.getWidth(),
                grayscaleImage.getHeight(),
                BufferedImage.TYPE_BYTE_BINARY);

        Graphics2D binaryGraphics = binaryImage.createGraphics();
        binaryGraphics.drawImage(grayscaleImage, 0, 0, null);
        binaryGraphics.dispose();

        return binaryImage;
    }

    /**
     * Skaliert ein Bild hoch, um kleine Schrift besser für OCR lesbar zu machen.
     */
    private BufferedImage scaleImage(BufferedImage sourceImage, double scaleFactor) {
        int scaledWidth = (int) Math.round(sourceImage.getWidth() * scaleFactor);
        int scaledHeight = (int) Math.round(sourceImage.getHeight() * scaleFactor);

        BufferedImage scaledImage = new BufferedImage(
                scaledWidth,
                scaledHeight,
                BufferedImage.TYPE_INT_RGB);

        Graphics2D graphics = scaledImage.createGraphics();
        graphics.setRenderingHint(
                RenderingHints.KEY_INTERPOLATION,
                RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        graphics.drawImage(sourceImage, 0, 0, scaledWidth, scaledHeight, null);
        graphics.dispose();

        return scaledImage;
    }

    /*
     * -------------------------------------------------------------
     * Validierung & Normalisierung
     * -------------------------------------------------------------
     */

    /**
     * Prüft, ob eine hochgeladene Datei vorhanden und nicht leer ist.
     */
    private void validateUploadedFile(MultipartFile file, String errorMessage) {
        if (file == null || file.isEmpty()) {
            throw new TextExtractionException(errorMessage);
        }
    }

    /**
     * Vereinheitlicht Zeilenumbrüche und reduziert überflüssige Leerzeilen.
     */
    private String normalizeText(String text) {
        String normalizedText = text == null ? "" : text;

        normalizedText = normalizedText
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .replace("\t", " ");

        normalizedText = normalizedText.replaceAll("\n{3,}", "\n\n");

        return normalizedText.trim();
    }
}
package com.rezeptmanager.backend.service;

import com.itextpdf.text.Document;
import com.itextpdf.text.Font;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.pdf.PdfWriter;
import com.rezeptmanager.backend.model.Recipe;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class PdfExportService {

    public byte[] exportRecipeToPdf(Recipe recipe) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(doc, baos);

            doc.open();

            // Titel
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
            doc.add(new Paragraph(recipe.getTitle() != null ? recipe.getTitle() : "Rezept", titleFont));
            doc.add(new Paragraph("\n"));

            // Zutaten
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

            doc.add(new Paragraph("Zutaten:", headerFont));
            doc.add(new Paragraph(
                    recipe.getIngredients() != null ? recipe.getIngredients() : "",
                    normalFont));
            doc.add(new Paragraph("\n"));

            // Beschreibung
            doc.add(new Paragraph("Beschreibung:", headerFont));
            doc.add(new Paragraph(
                    recipe.getDescription() != null ? recipe.getDescription() : "",
                    normalFont));

            doc.close();
            return baos.toByteArray();

        } catch (Exception e) {
            e.printStackTrace(); // im Log sehen, falls noch etwas schiefgeht
            throw new RuntimeException("PDF-Erstellung fehlgeschlagen", e);
        }
    }
}

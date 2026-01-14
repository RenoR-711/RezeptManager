package com.rezeptmanager.backend.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Service
public class PdfService {

    public String extractTextFromPdf(MultipartFile file) {
        try (InputStream input = file.getInputStream();
                PDDocument document = PDDocument.load(input)) {

            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);

        } catch (Exception e) {
            throw new RuntimeException("PDF konnte nicht gelesen werden: " + e.getMessage());
        }
    }
}

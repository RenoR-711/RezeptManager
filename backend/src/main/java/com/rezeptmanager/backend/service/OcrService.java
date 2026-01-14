package com.rezeptmanager.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class OcrService {

    public String extractTextFromImage(MultipartFile file) {
        // TODO: Hier echten OCR-Call einbauen (z.B. Google Vision, Tesseract, Azure,
        // ...)
        // Aktuell nur Dummy-Text:
        return """
                Beispielrezept
                Zutaten:
                - 200g Mehl
                - 2 Eier
                - 100ml Milch

                Zubereitung:
                Alles verrühren und backen.
                """;
    }

    public String extractTextFromFile(MultipartFile file) {
        // TODO: Für PDF/Bild-Dateien einen OCR- oder PDF-Text-Extractor einbauen.
        // Aktuell ebenfalls Dummy:
        return """
                PDF-Rezept
                Zutaten:
                - 500g Nudeln
                - 1 Glas Tomatensauce

                Zubereitung:
                Nudeln kochen, Sauce erhitzen, servieren.
                """;
    }
}

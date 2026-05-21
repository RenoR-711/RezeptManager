package com.rezeptmanager.backend.controller;

import com.rezeptmanager.backend.service.PdfExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PdfExportController {

    private final PdfExportService pdfExportService;

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> exportRecipeAsPdf(@PathVariable Long id) {
        byte[] pdfBytes = pdfExportService.exportRecipeToPdf(id);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=recipe-" + id + ".pdf"
                )
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
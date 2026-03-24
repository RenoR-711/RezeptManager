package com.rezeptmanager.backend.controller;

import com.rezeptmanager.backend.dto.ParsedRecipe;
import com.rezeptmanager.backend.model.Recipe;
import com.rezeptmanager.backend.service.BarcodeService;
import com.rezeptmanager.backend.service.ScanService;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/* =========================================================
   ScanController
   ---------------------------------------------------------
   REST-Endpunkte für den Scan-Flow.

   Verantwortung:
   - Datei-Uploads für Bild/PDF entgegennehmen
   - Preview-Scans bereitstellen
   - gescannte Rezepte speichern
   - Barcode-Lookups weiterreichen

   Nicht verantwortlich für:
   - OCR / PDF-Text-Extraktion
   - Parsing der Rezeptdaten
   - Speichern der Originaldatei
   - Mapping zwischen Scan-Ergebnis und Entity
========================================================= */

@RestController
@RequestMapping("/api/scan")
@CrossOrigin(origins = "http://localhost:5173")
public class ScanController {

    private final ScanService scanService;
    private final BarcodeService barcodeService;

    public ScanController(
            ScanService scanService,
            BarcodeService barcodeService) {
        this.scanService = scanService;
        this.barcodeService = barcodeService;
    }

    /*
     * -------------------------------------------------------------
     * Preview
     * -------------------------------------------------------------
     */

    @PostMapping("/image-preview")
    public ParsedRecipe scanImagePreview(@RequestParam("file") MultipartFile file) {
        return scanService.previewImage(file);
    }

    @PostMapping("/pdf-preview")
    public ParsedRecipe scanPdfPreview(@RequestParam("file") MultipartFile file) {
        return scanService.previewPdf(file);
    }

    /*
     * -------------------------------------------------------------
     * Scan + Save
     * -------------------------------------------------------------
     */

    @PostMapping("/image")
    public Recipe scanImageAndSave(@RequestParam("file") MultipartFile file) {
        return scanService.scanImageAndSave(file);
    }

    @PostMapping("/pdf")
    public Recipe scanPdfAndSave(@RequestParam("file") MultipartFile file) {
        return scanService.scanPdfAndSave(file);
    }

    /*
     * -------------------------------------------------------------
     * Barcode
     * -------------------------------------------------------------
     */

    @GetMapping("/barcode/{ean}")
    public Object lookupBarcode(@PathVariable String ean) {
        return barcodeService.lookupProduct(ean);
    }
}
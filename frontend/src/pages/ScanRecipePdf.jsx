import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ScannedRecipeForm from "../components/ScannedRecipeForm";
import {
  buildRecipePayload,
  createRecipeFromScanResult,
} from "../utils/recipeScanHelpers";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8081";

/**
 * -------------------------------------------------------------
 * ScanRecipePdf
 * -------------------------------------------------------------
 * Liest ein Rezept aus einer PDF ein.
 *
 * Ablauf:
 * - PDF auswählen
 * - Backend analysiert die Datei
 * - erkannte Daten im Formular prüfen
 * - Rezept speichern
 * -------------------------------------------------------------
 */
export default function ScanRecipePdf() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [recipe, setRecipe] = useState(null);

  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ---------------------------------------------------------
     Datei auswählen
  --------------------------------------------------------- */

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] ?? null;

    setSelectedFile(nextFile);
    setRecipe(null);
    setError("");
  }

  /* ---------------------------------------------------------
     PDF analysieren
  --------------------------------------------------------- */

  async function handleScan() {
    if (!selectedFile) {
      setError("Bitte zuerst eine PDF auswählen.");
      return;
    }

    setScanning(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_BASE}/api/scan/pdf-preview`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || "PDF-Analyse fehlgeschlagen.");
      }

      const data = await response.json();
      setRecipe(createRecipeFromScanResult(data));
    } catch (err) {
      setError(err?.message || "Die PDF konnte nicht analysiert werden.");
    } finally {
      setScanning(false);
    }
  }

  /* ---------------------------------------------------------
     Rezept speichern
  --------------------------------------------------------- */

  async function handleSave() {
    if (!recipe?.title?.trim()) {
      setError("Bitte einen Titel eingeben.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = buildRecipePayload(recipe);

      const response = await fetch(`${API_BASE}/api/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || "Speichern fehlgeschlagen.");
      }

      const createdRecipe = await response.json().catch(() => null);

      if (createdRecipe?.id) {
        navigate(`/recipes/${createdRecipe.id}`);
        return;
      }

      navigate("/recipes");
    } catch (err) {
      setError(err?.message || "Das Rezept konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------
     Render
  --------------------------------------------------------- */

  return (
    <div className="page">
      <h1>Rezept aus PDF einlesen</h1>

      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        disabled={scanning || saving}
      />

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={handleScan}
          disabled={!selectedFile || scanning || saving}
        >
          {scanning ? "PDF wird analysiert..." : "PDF analysieren"}
        </button>
      </div>

      {error && !recipe ? (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: 10,
            borderRadius: 8,
            background: "#ffe5e5",
            border: "1px solid #ffb3b3",
          }}
        >
          {error}
        </div>
      ) : null}

      {recipe ? (
        <ScannedRecipeForm
          recipe={recipe}
          setRecipe={setRecipe}
          onSave={handleSave}
          saving={saving}
          error={error}
          saveLabel="Rezept speichern"
        />
      ) : null}
    </div>
  );
}
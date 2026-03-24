import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ScannedRecipeForm from "../components/ScannedRecipeForm";
import {
  buildRecipePayload,
  createRecipeFromScanResult,
} from "../utils/recipeScanHelpers";

/* =========================================================
   Konstanten
========================================================= */

const API_BASE = "http://localhost:8081";

/* =========================================================
   Komponente
========================================================= */

export default function UploadRecipeImage() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [recipe, setRecipe] = useState(null);

  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  /* =======================================================
     Datei-Auswahl
  ======================================================= */

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] ?? null;

    setSelectedFile(nextFile);
    setRecipe(null);
    setError("");
  }

  /* =======================================================
     Bild analysieren
  ======================================================= */

  async function handleScan() {
    if (!selectedFile) return;

    setScanning(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_BASE}/api/scan/image-preview`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Bild-Analyse fehlgeschlagen.");
      }

      const data = await response.json();
      setRecipe(createRecipeFromScanResult(data));
    } catch (err) {
      setError(err.message || "Das Bild konnte nicht analysiert werden.");
    } finally {
      setScanning(false);
    }
  }

  /* =======================================================
     Rezeptbild hochladen
  ======================================================= */

  async function handleImageUpload(event) {
    const imageFile = event.target.files?.[0];
    if (!imageFile) return;

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await fetch(`${API_BASE}/api/uploads/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Bild-Upload fehlgeschlagen.");
      }

      const imageUrl = await response.text();

      setRecipe((prev) => ({
        ...prev,
        imageUrl,
      }));
    } catch (err) {
      setError(err.message || "Das Rezeptbild konnte nicht hochgeladen werden.");
    }
  }

  /* =======================================================
     Rezept speichern
  ======================================================= */

  async function handleSave() {
    if (!recipe) return;

    setSaving(true);
    setError("");

    const payload = buildRecipePayload(recipe);

    try {
      const response = await fetch(`${API_BASE}/api/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Speichern fehlgeschlagen.");
      }

      await response.json();
      navigate("/recipes");
    } catch (err) {
      setError(err.message || "Das Rezept konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="page">
      <h2>Rezept aus Foto einlesen</h2>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      <div style={{ marginTop: "1rem" }}>
        <button disabled={!selectedFile || scanning} onClick={handleScan}>
          {scanning ? "Bild wird analysiert..." : "Bild analysieren"}
        </button>
      </div>

      {error && !recipe && <p style={{ color: "red" }}>{error}</p>}

      {recipe && (
        <ScannedRecipeForm
          recipe={recipe}
          setRecipe={setRecipe}
          onSave={handleSave}
          onImageUpload={handleImageUpload}
          saving={saving}
          error={error}
          saveLabel="Rezept speichern"
        />
      )}
    </div>
  );
}
/* -------------------------------------------------------------
   Ende
------------------------------------------------------------- */

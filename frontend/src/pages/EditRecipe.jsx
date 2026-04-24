/**
 * -------------------------------------------------------------
 * EditRecipe
 * -------------------------------------------------------------
 * Seite zum Bearbeiten eines Rezepts.
 *
 * Ablauf:
 * - Rezept aus dem Backend laden, Rezept über API laden (GET /api/recipes/:id)
 * - Daten ins Formular übernehmen, API-Daten in Formularstruktur mappen
 * - Änderungen speichern (PUT /api/recipes/:id)
 * -------------------------------------------------------------
 * Architektur:
 * - Formular ist ausgelagert in RecipeForm (Wiederverwendbarkeit)
 * - Mapper trennt API-Struktur und UI-Formular
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import RecipeForm from "../components/RecipeForm";
import {
    mapRecipeToForm,
    buildPayloadFromForm,
} from "../utils/recipeFormMapper";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8081";

export default function EditRecipe() {
    /** ----------------------------------------------------------
     * Router
     * ---------------------------------------------------------- */

    // Rezept-ID aus URL
    const { id } = useParams();

    // Navigation innerhalb der App
    const navigate = useNavigate();

    /** ----------------------------------------------------------
     * State
     * ---------------------------------------------------------- */

    // Original-Rezept aus API (für imageUrl etc.)
    const [recipe, setRecipe] = useState(null);

    const [imageFile, setImageFile] = useState(null);

    // UI Status
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Formular-State (UI)
    const [form, setForm] = useState({
        title: "",
        description: "",
        ingredients: [],
        categories: [],
        difficultyLevel: "EASY",
        prepTimeMinutes: "",
        cookTimeMinutes: "",
        servings: "",
        calories: "",
        protein: "",
        carbohydrates: "",
        fats: "",
        rating: "",
    });



    /** ----------------------------------------------------------
     * Rezept laden
     * ----------------------------------------------------------
     * Lädt ein einzelnes Rezept vom Backend
     * und überführt es in den Formular-State.
     */

    useEffect(() => {
        let ignore = false;

        async function loadRecipe() {
            setLoading(true);
            setError("");

            try {
                const res = await fetch(`${API_BASE}/api/recipes/${id}`);

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(text || `Rezept nicht gefunden (HTTP ${res.status})`);
                }

                const data = await res.json();

                if (ignore) return;

                // Originaldaten speichern
                setRecipe(data);

                // API -> Formularstruktur
                const mapped = mapRecipeToForm(data);
                setForm(mapped);
            } catch (err) {
                if (!ignore) {
                    setError(err?.message || "Fehler beim Laden.");
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        loadRecipe();

        return () => {
            ignore = true;
        };
    }, [id]);

    /** ----------------------------------------------------------
     * Rezept speichern
     * ----------------------------------------------------------
     * Sendet die Änderungen an das Backend.
     */

    async function handleUpdate(event) {
        event.preventDefault();
        setError("");

        // einfache Validierung
        if (!form.title.trim()) {
            setError("Bitte einen Titel eingeben.");
            return;
        }

        try {
            setSaving(true);

            let imageUrl = recipe?.imageUrl || "";

            if (imageFile) {
                const imageData = new FormData();
                imageData.append("file", imageFile);

                const uploadResponse = await fetch(`${API_BASE}/api/images/recipes/${id}`, {
                    method: "POST",
                    body: imageData,
                });

                if (!uploadResponse.ok) {
                    const text = await uploadResponse.text().catch(() => "");
                    throw new Error(text || `Bild konnte nicht hochgeladen werden (HTTP ${uploadResponse.status})`);
                }

                const uploadResult = await uploadResponse.json().catch(() => null);
                imageUrl =
                    uploadResult?.imageUrl ||
                    uploadResult?.url ||
                    uploadResult?.path ||
                    imageUrl;
            }

            // Formular -> API Payload
            const payload = buildPayloadFromForm(form, {
                imageUrl,
            });

            console.log("UPDATE PAYLOAD", payload);
            
            const response = await fetch(`${API_BASE}/api/recipes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(text || `Fehler beim Speichern (HTTP ${response.status})`);
            }

            const updated = await response.json().catch(() => null);

            // nach erfolgreichem Update zur Detailseite
            navigate(`/recipes/${updated?.id || id}`);
        } catch (err) {
            setError(err?.message || "Fehler beim Speichern.");
        } finally {
            setSaving(false);
        }
    }

    const imagePreviewUrl = useMemo(() => {
        if (imageFile) {
            return URL.createObjectURL(imageFile);
        }

        const url = recipe?.imageUrl?.trim();
        if (!url) return "";

        return url.startsWith("http") ? url : `${API_BASE}${url}`;
    }, [imageFile, recipe?.imageUrl]);

    useEffect(() => {
        return () => {
            if (imagePreviewUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    function handleImageChange(file) {
        setImageFile(file || null);
    }

    /** ----------------------------------------------------------
     * UI: Ladezustand
     * ---------------------------------------------------------- */

    if (loading) {
        return (
            <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
                <p>Lade Rezept…</p>
            </div>
        );
    }

    /** ----------------------------------------------------------
     * UI: Fehler beim Laden
     * ---------------------------------------------------------- */

    if (!recipe && error) {
        return (
            <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
                <h1>Rezept bearbeiten</h1>

                <div
                    role="alert"
                    style={{
                        background: "#ffe5e5",
                        border: "1px solid #ffb3b3",
                        padding: 10,
                        borderRadius: 8,
                        marginTop: 12,
                    }}
                >
                    {error}
                </div>

                <div style={{ marginTop: 12 }}>
                    <button
                        type="button" onClick={() => navigate("/recipes")}>
                        Zurück zur Liste
                    </button>
                </div>
            </div>
        );
    }

    /** ----------------------------------------------------------
     * UI: Formular
     * ---------------------------------------------------------- */

    return (
        <div>
            <h1 style={{ maxWidth: 900, margin: "0 auto", padding: "16px 16px 0" }}>
                Rezept bearbeiten
            </h1>

            <RecipeForm
                form={form}
                setForm={setForm}
                onSubmit={handleUpdate}
                submitLabel="Änderungen speichern"
                saving={saving}
                error={error}
                onCancel={() => navigate(`/recipes/${id}`)}
                imageFile={imageFile}
                imagePreviewUrl={imagePreviewUrl}
                onImageChange={handleImageChange}
            />
        </div>
    );
}
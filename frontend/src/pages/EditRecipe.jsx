/**
 * -------------------------------------------------------------
 * EditRecipe
 * -------------------------------------------------------------
 * Seite zum Bearbeiten eines Rezepts.
 *
 * Ablauf:
 * - Rezept aus dem Backend laden
 * - Daten ins Formular übernehmen
 * - Änderungen speichern
 * -------------------------------------------------------------
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import RecipeForm from "../components/RecipeForm";
import {
    mapRecipeToForm,
    buildPayloadFromForm,
} from "../utils/recipeFormMapper";

const API_BASE = "http://localhost:8081";

export default function EditRecipe() {
    /* ---------------------------------------------------------
       Router
    --------------------------------------------------------- */

    const { id } = useParams();
    const navigate = useNavigate();

    /* ---------------------------------------------------------
       State
    --------------------------------------------------------- */

    const [recipe, setRecipe] = useState(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        ingredients: "",
        instructions: "",
        categories: [],
        difficultyLevel: "",
        prepTimeMinutes: "",
        cookTimeMinutes: "",
        servings: "",
        calories: "",
        protein: "",
        carbohydrates: "",
        fats: "",
        rating: "",
        imageUrl: "",
        imageFile: null,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    /* ---------------------------------------------------------
       Rezept laden
    --------------------------------------------------------- */

    useEffect(() => {
        async function loadRecipe() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(`${API_BASE}/api/recipes/${id}`);

                if (!response.ok) {
                    throw new Error(`Rezept nicht gefunden (HTTP ${response.status})`);
                }

                const data = await response.json();
                const mappedForm = mapRecipeToForm(data);

                setRecipe(data);

                setForm((prev) => ({
                    ...prev,
                    ...mappedForm,
                    ingredients:
                        typeof mappedForm?.ingredients === "string"
                            ? mappedForm.ingredients
                            : "",
                    instructions:
                        typeof mappedForm?.instructions === "string"
                            ? mappedForm.instructions
                            : "",
                    categories: Array.isArray(mappedForm?.categories)
                        ? mappedForm.categories
                        : [],
                    imageUrl: mappedForm?.imageUrl || data?.imageUrl || "",
                    imageFile: null,
                }));
            } catch (err) {
                setError(err?.message || "Fehler beim Laden.");
            } finally {
                setLoading(false);
            }
        }

        loadRecipe();
    }, [id]);

    /* ---------------------------------------------------------
       Rezept speichern
    --------------------------------------------------------- */

    async function handleUpdate(event) {
        event.preventDefault();
        setError("");

        if (!form.title.trim()) {
            setError("Bitte einen Titel eingeben.");
            return;
        }

        try {
            setSaving(true);

            let imageUrl = form.imageUrl || recipe?.imageUrl || "";

            if (form.imageFile) {
                const imageData = new FormData();
                imageData.append("file", form.imageFile);

                const uploadResponse = await fetch(`${API_BASE}/api/images/upload`, {
                    method: "POST",
                    body: imageData,
                });

                if (!uploadResponse.ok) {
                    const uploadText = await uploadResponse.text().catch(() => "");
                    throw new Error(
                        uploadText ||
                        `Bild konnte nicht hochgeladen werden (HTTP ${uploadResponse.status})`
                    );
                }

                const uploadResult = await uploadResponse.json().catch(() => null);

                imageUrl =
                    uploadResult?.imageUrl ||
                    uploadResult?.url ||
                    uploadResult?.path ||
                    imageUrl;
            }

            const payload = buildPayloadFromForm(form, {
                imageUrl,
            });

            const response = await fetch(`${API_BASE}/api/recipes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Fehler beim Speichern (HTTP ${response.status})`);
            }

            const updatedRecipe = await response.json().catch(() => null);
            navigate(`/recipes/${updatedRecipe?.id || id}`);
        } catch (err) {
            setError(err?.message || "Fehler beim Speichern.");
        } finally {
            setSaving(false);
        }
    }

    /* ---------------------------------------------------------
       Bild
    --------------------------------------------------------- */

    const imagePreviewUrl = useMemo(() => {
        if (form.imageFile) {
            return URL.createObjectURL(form.imageFile);
        }

        return form.imageUrl || recipe?.imageUrl || "";
    }, [form.imageFile, form.imageUrl, recipe?.imageUrl]);

    useEffect(() => {
        return () => {
            if (imagePreviewUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    function handleImageChange(event) {
        const file = event.target.files?.[0] ?? null;

        setForm((prev) => ({
            ...prev,
            imageFile: file,
        }));
    }

    /* ---------------------------------------------------------
       Ladezustand
    --------------------------------------------------------- */

    if (loading) {
        return (
            <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
                <p>Lade Rezept…</p>
            </div>
        );
    }

    /* ---------------------------------------------------------
       Fehleransicht
    --------------------------------------------------------- */

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
                    <button type="button" onClick={() => navigate("/recipes")}>
                        Zurück zur Liste
                    </button>
                </div>
            </div>
        );
    }

    /* ---------------------------------------------------------
       Formular
    --------------------------------------------------------- */

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
                imageFile={form.imageFile}
                imagePreviewUrl={imagePreviewUrl}
                onImageChange={handleImageChange}
            />
        </div>
    );
}
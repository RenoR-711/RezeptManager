import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import RecipeForm from "../components/RecipeForm";
import {
    buildPayloadFromForm,
    EMPTY_RECIPE_FORM,
} from "../utils/recipeFormMapper";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8081";

/**
 * -------------------------------------------------------------
 * NewRecipe
 * -------------------------------------------------------------
 * Seite zum Anlegen eines neuen Rezepts.
 *
 * Ablauf:
 * - Formular ausfüllen
 * - optional ein Bild auswählen
 * - Rezept speichern
 * -------------------------------------------------------------
 */
export default function NewRecipe() {
    const navigate = useNavigate();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(EMPTY_RECIPE_FORM);

    /* ---------------------------------------------------------
       Rezept speichern
    --------------------------------------------------------- */

    async function handleCreate(event) {
        event.preventDefault();
        setError("");

        if (!form.title.trim()) {
            setError("Bitte einen Titel eingeben.");
            return;
        }

        try {
            setSaving(true);

            let imageUrl = form.imageUrl || "";

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

            const payload = buildPayloadFromForm(form, { imageUrl });

            const response = await fetch(`${API_BASE}/api/recipes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const message = await response.text().catch(() => "");
                throw new Error(message || "Fehler beim Speichern.");
            }

            const createdRecipe = await response.json().catch(() => null);

            if (createdRecipe?.id) {
                navigate(`/recipes/${createdRecipe.id}`);
                return;
            }

            navigate("/recipes");
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

        return form.imageUrl || "";
    }, [form.imageFile, form.imageUrl]);

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
       Render
    --------------------------------------------------------- */

    return (
        <div>
            <h1 style={{ maxWidth: 900, margin: "0 auto", padding: "16px 16px 0" }}>
                Neues Rezept
            </h1>

            <RecipeForm
                form={form}
                setForm={setForm}
                onSubmit={handleCreate}
                submitLabel="Rezept speichern"
                saving={saving}
                error={error}
                onCancel={() => navigate("/recipes")}
                imageFile={form.imageFile}
                imagePreviewUrl={imagePreviewUrl}
                onImageChange={handleImageChange}
            />
        </div>
    );
}
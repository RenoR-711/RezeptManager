import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RecipeForm from "../components/RecipeForm";
import { buildPayloadFromForm } from "../utils/recipeFormMapper";

const API_BASE = "http://localhost:8081";

export default function NewRecipe() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        title: "",
        description: "",
        ingredients: "",
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

    async function handleCreate(e) {
        e.preventDefault();
        setError("");

        if (!form.title.trim()) {
            setError("Bitte einen Titel eingeben.");
            return;
        }

        const payload = buildPayloadFromForm(form, { imageUrl: "" });

        try {
            setSaving(true);
            const res = await fetch(`${API_BASE}/api/recipes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());

            const created = await res.json().catch(() => null);
            if (created?.id) navigate(`/recipes/${created.id}`);
            else navigate("/recipes");
        } catch (err) {
            setError(err?.message || "Fehler beim Speichern.");
        } finally {
            setSaving(false);
        }
    }

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
            />
        </div>
    );
}
/* -------------------------------------------------------------
   Ende
------------------------------------------------------------- */
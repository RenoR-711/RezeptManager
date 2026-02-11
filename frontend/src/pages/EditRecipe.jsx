import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RecipeForm from "../components/RecipeForm";
import {
    mapRecipeToForm,
    buildPayloadFromForm,
} from "../utils/recipeFormMapper";

const API_BASE = "http://localhost:8081";

export default function EditRecipe() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null); // Original aus API (für imageUrl, id etc.)
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

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // 1) Laden
    useEffect(() => {
        let ignore = false;

        async function load() {
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

                setRecipe(data);
                setForm(mapRecipeToForm(data));
            } catch (err) {
                if (!ignore) {
                    setError(err?.message || "Fehler beim Laden.");
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        load();
        return () => {
            ignore = true;
        };
    }, [id]);

    // 2) Speichern (PUT)
    async function handleUpdate(e) {
        e.preventDefault();
        setError("");

        if (!form.title.trim()) {
            setError("Bitte einen Titel eingeben.");
            return;
        }

        // imageUrl vom Original übernehmen (oder später hier überschreiben, wenn du Upload integrierst)
        const payload = buildPayloadFromForm(form, { imageUrl: recipe?.imageUrl });

        try {
            setSaving(true);

            const res = await fetch(`${API_BASE}/api/recipes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `Fehler beim Speichern (HTTP ${res.status})`);
            }

            const updated = await res.json().catch(() => null);

            // nach Update zurück zur Detailseite
            if (updated?.id) navigate(`/recipes/${updated.id}`);
            else navigate(`/recipes/${id}`);
        } catch (err) {
            setError(err?.message || "Fehler beim Speichern.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
                <p>Lade Rezept…</p>
            </div>
        );
    }

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
                    <button className="btn" onClick={() => navigate("/recipes")}>
                        Zurück zur Liste
                    </button>
                </div>
            </div>
        );
    }

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
            />
        </div>
    );
}
/* -------------------------------------------------------------
   Ende
------------------------------------------------------------- */
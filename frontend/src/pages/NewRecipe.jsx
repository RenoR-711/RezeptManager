import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/categories";
/* -------------------------------------------------------------
   Hilfsfunktionen
------------------------------------------------------------- */
/* ---------------- State-Handler ---------------- */
function toggleCategory(cat) {
    setRecipe((prev) => ({
        ...prev,
        categories: prev.categories.includes(cat)
            ? prev.categories.filter((c) => c !== cat)
            : [...prev.categories, cat],
    }));
}

/* -------------------------------------------------------------
   Hauptkomponente
------------------------------------------------------------- */
export default function RecipeForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: "",
        description: "",
        categories: [],
        ingredientsRows: [{ amount: "", name: "" }]
    });
    const categories = CATEGORIES.map(c => c.name);

    // Titel & Beschreibung
    function updateField(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
    }
    // Zutaten bearbeiten
    function updateIngredientRow(index, field, value) {
        setForm(prev => {
            const rows = [...prev.ingredientsRows];
            rows[index] = { ...rows[index], [field]: value };
            return { ...prev, ingredientsRows: rows };
        });
    }
    function addIngredientRow() {
        setForm(prev => ({
            ...prev,
            ingredientsRows: [...prev.ingredientsRows, { amount: "", name: "" }]
        }));
    }
    function removeIngredientRow(index) {
        setForm(prev => {
            const rows = [...prev.ingredientsRows];
            rows.splice(index, 1);
            return {
                ...prev,
                ingredientsRows:
                    rows.length > 0 ? rows : [{ amount: "", name: "" }]
            };
        });
    }
    /* ---------------- Speichern ---------------- */
    function handleSubmit(e) {
        e.preventDefault();
        const ingredientsString = form.ingredientsRows
            .filter(r => r.amount.trim() || r.name.trim())
            .map(r => `${r.amount} ${r.name}`.trim())
            .join("\n");
        const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            ingredients: ingredientsString
        };
        fetch("http://localhost:8081/api/recipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(() => navigate("/recipes"));
    }
    /* ---------------- UI ---------------- */
    return (
        <div className="page">
            <h2>Neues Rezept anlegen</h2>
            <form onSubmit={handleSubmit} style={{ maxWidth: "500px" }}>
                {/* Titel */}
                <label htmlFor="title"><h3>Titel</h3></label>
                <input
                    type="text"
                    value={form.title}
                    onChange={e => updateField("title", e.target.value)}
                    required
                    style={{ width: "100%", marginBottom: "1rem" }}
                />
                <label htmlFor="kategorien"><h3>Kategorien</h3></label>
                <div
                    style={{
                        marginBottom: "1rem",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.8rem",
                    }}
                >
                    {categories.map((cat) => (
                        <label
                            key={cat}
                            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                        >
                            <input
                                type="checkbox"
                                checked={form.categories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                            />
                            {cat}
                        </label>
                    ))}
                </div>
                {/* Beschreibung */}
                <label htmlFor="description"><h3>Beschreibung</h3></label>
                <textarea
                    value={form.description}
                    onChange={e => updateField("description", e.target.value)}
                    rows={4}
                    style={{ width: "100%", marginBottom: "1rem" }}
                />
                {/* Zutaten */}
                <h3>Zutaten</h3>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: "1rem"
                    }}
                >
                    <thead>
                        <tr>
                            <th style={{ borderBottom: "1px solid #ccc" }}>Menge</th>
                            <th style={{ borderBottom: "1px solid #ccc" }}>Zutat</th>
                            <th style={{ borderBottom: "1px solid #ccc" }}>Aktion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {form.ingredientsRows.map((row, idx) => (
                            <tr key={idx}>
                                <td>
                                    <input
                                        type="text"
                                        value={row.amount}
                                        onChange={e =>
                                            updateIngredientRow(idx, "amount", e.target.value)
                                        }
                                        style={{ width: "80px", textAlign: "center" }}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={row.name}
                                        onChange={e =>
                                            updateIngredientRow(idx, "name", e.target.value)
                                        }
                                        style={{ width: "100%" }}
                                    />
                                </td>
                                <td>
                                    <button type="button" onClick={() => removeIngredientRow(idx)}>
                                        Entfernen
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" onClick={addIngredientRow}>
                    + Zutat hinzufügen
                </button>
                <div style={{ marginTop: "2rem" }}>
                    <button type="submit">Speichern</button>
                </div>
            </form>
        </div>
    );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/categories";

/* -------------------------------------------------------------
   Hilfsfunktionen
------------------------------------------------------------- */

function newIngredientRow() {
    return { id: crypto.randomUUID(), amount: "", name: "" };
}

function splitIngredient(line) {
    if (!line) return { amount: "", name: "" };

    const parts = line.trim().split(" ");

    if (parts.length >= 3) {
        return {
            amount: parts.slice(0, 2).join(" "),
            name: parts.slice(2).join(" "),
        };
    }

    if (parts.length === 2) {
        return { amount: parts[0], name: parts[1] };
    }

    return { amount: "", name: line.trim() };
}

/* -------------------------------------------------------------
   Hauptkomponente
------------------------------------------------------------- */

export default function EditRecipe() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);

const categories = CATEGORIES.map(c => c.name);

    /* ---------------- Rezept laden ---------------- */

    useEffect(() => {
        fetch(`http://localhost:8081/api/recipes/${id}`)
            .then((res) => res.json())
            .then((data) => {
                setRecipe({
                    id: data.id,
                    title: data.title || "",
                    description: data.description || "",
                    categories: data.categories?.map((c) => c.name) ?? [],
                    ingredientsRows: data.ingredients
                        ? data.ingredients.split(/\r?\n/).map((line) => ({
                            id: crypto.randomUUID(),
                            ...splitIngredient(line),
                        }))
                        : [newIngredientRow()],
                });
                setLoading(false);
            });
    }, [id]);

    if (loading || !recipe) {
        return <div className="page">Lade Rezept…</div>;
    }

    /* ---------------- State-Handler ---------------- */

    function toggleCategory(cat) {
        setRecipe((prev) => ({
            ...prev,
            categories: prev.categories.includes(cat)
                ? prev.categories.filter((c) => c !== cat)
                : [...prev.categories, cat],
        }));
    }

    function updateField(field, value) {
        setRecipe((prev) => ({ ...prev, [field]: value }));
    }

    function updateIngredientRow(id, field, value) {
        setRecipe((prev) => ({
            ...prev,
            ingredientsRows: prev.ingredientsRows.map((r) =>
                r.id === id ? { ...r, [field]: value } : r
            ),
        }));
    }

    function addIngredientRow() {
        setRecipe((prev) => ({
            ...prev,
            ingredientsRows: [...prev.ingredientsRows, newIngredientRow()],
        }));
    }

    function removeIngredientRow(id) {
        setRecipe((prev) => ({
            ...prev,
            ingredientsRows: prev.ingredientsRows.filter((r) => r.id !== id),
        }));
    }

    /* ---------------- Speichern ---------------- */

    function handleSubmit(e) {
        e.preventDefault();

        const ingredients = recipe.ingredientsRows
            .filter((r) => r.amount.trim() || r.name.trim())
            .map((r) => `${r.amount} ${r.name}`.trim())
            .join("\n");

        fetch(`http://localhost:8081/api/recipes/${recipe.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...recipe,
                ingredients,
                categories: recipe.categories.map((name) => ({ name })),
            }),
        }).then(() => navigate(`/recipes/${recipe.id}`));
    }
/* ---------------- handleImageUpload ---------------- */
    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("http://localhost:8081/api/uploads/image", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Upload fehlgeschlagen");
            }

            const imageUrl = await res.text();

            // imageUrl direkt im Recipe-State speichern
            setRecipe((prev) => ({
                ...prev,
                imageUrl,
            }));
        } catch (err) {
            console.error(err);
            alert("Bild-Upload fehlgeschlagen");
        }
    }


/* ---------------- UI ---------------- */

    return (
        <div className="page">
            <h2>Rezept bearbeiten</h2>

            <form className="edit-form" onSubmit={handleSubmit}>
                <label htmlFor="titel">Titel</label>
                <input
                    value={recipe.title}
                    onChange={(e) => updateField("title", e.target.value)}
                />

                <div style={{ marginBottom: "1rem" }}>
                    <label>
                        Rezeptbild:
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: "block", marginTop: "0.5rem" }}
                        />
                    </label>
                </div>

                <label htmlFor="kategorien">Kategorien</label>
                <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
                    {categories.map((cat) => (
                        <label key={cat} style={{ display: "flex", gap: "0.4rem" }}>
                            <input
                                type="checkbox"
                                checked={recipe.categories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                            />
                            {cat}
                        </label>
                    ))}
                </div>

                <label htmlFor="beschreibung">Beschreibung</label>
                <textarea
                    id="beschreibung"
                    value={recipe.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={5}
                    style={{ width: "100%", marginBottom: "1rem" }}
                />

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: "1rem",
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
                        {recipe.ingredientsRows.map((row, idx) => (
                            <tr key={row.id}>
                                <td>
                                    <input
                                        type="text"
                                        value={row.amount}
                                        onChange={(e) =>
                                            updateIngredientRow(idx, "amount", e.target.value)
                                        }
                                        style={{ width: "70px" }}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={row.name}
                                        onChange={(e) =>
                                            updateIngredientRow(idx, "name", e.target.value)
                                        }
                                        style={{ width: "100%" }}
                                    />
                                </td>
                                <td>
                                    <button onClick={() => removeIngredientRow(idx)}>
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button type="button" onClick={addIngredientRow}>
                    + Zutat
                </button>

                <button type="submit">Speichern</button>
            </form>
        </div>
    );
}
// -------------------------------------------------------------


import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/categories";

/* -------------------------------------------------------------
   Helper
------------------------------------------------------------- */

function newIngredientRow() {
    return { id: crypto.randomUUID(), amount: "", name: "" };
}

function splitIngredient(line) {
    if (!line) return { amount: "", name: "" };

    const parts = line.trim().split(" ").filter(Boolean);

    // grob: "1 EL Zucker" => amount: "1 EL", name: "Zucker"
    if (parts.length >= 3) {
        return { amount: parts.slice(0, 2).join(" "), name: parts.slice(2).join(" ") };
    }
    if (parts.length === 2) {
        return { amount: parts[0], name: parts[1] };
    }
    return { amount: "", name: parts.join(" ") };
}

function toImageSrc(imageUrl) {
    if (!imageUrl) return "";
    const trimmed = String(imageUrl).trim();
    if (!trimmed) return "";
    return trimmed.startsWith("http") ? trimmed : `http://localhost:8081${trimmed}`;
}

function placeholderFromTitle(title) {
    const encoded = encodeURIComponent(title || "Rezept");
    return `https://placehold.co/800x500?text=${encoded}`;
}

/* -------------------------------------------------------------
   Component
------------------------------------------------------------- */

export default function EditRecipe() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const categoryNames = useMemo(() => CATEGORIES.map((c) => c.name), []);

    /* ---------------- Load recipe ---------------- */

    useEffect(() => {
        let isMounted = true;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`http://localhost:8081/api/recipes/${id}`);
                if (!res.ok) throw new Error("Rezept konnte nicht geladen werden.");
                const data = await res.json();

                const ingredientsRows = data.ingredients
                    ? data.ingredients.split(/\r?\n/).map((line) => ({
                        id: crypto.randomUUID(),
                        ...splitIngredient(line),
                    }))
                    : [newIngredientRow()];

                if (isMounted) {
                    setRecipe({
                        id: data.id,
                        title: data.title || "",
                        description: data.description || "",
                        ingredientsRows,
                        categories: data.categories?.map((c) => c.name) ?? [],
                        imageUrl: data.imageUrl || "", // ✅ wichtig
                        rawText: data.rawText || "",
                    });
                }
            } catch (e) {
                if (isMounted) setError(e?.message || "Unbekannter Fehler.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        load();
        return () => {
            isMounted = false;
        };
    }, [id]);

    if (loading) return <div className="page">Lade Rezept…</div>;
    if (error) return <div className="page" style={{ color: "crimson" }}>{error}</div>;
    if (!recipe) return <div className="page">Rezept nicht gefunden.</div>;

    /* ---------------- State helpers ---------------- */

    function updateField(field, value) {
        setRecipe((prev) => ({ ...prev, [field]: value }));
    }

    function toggleCategory(cat) {
        setRecipe((prev) => ({
            ...prev,
            categories: prev.categories.includes(cat)
                ? prev.categories.filter((c) => c !== cat)
                : [...prev.categories, cat],
        }));
    }

    function updateIngredientRow(rowId, field, value) {
        setRecipe((prev) => ({
            ...prev,
            ingredientsRows: prev.ingredientsRows.map((r) =>
                r.id === rowId ? { ...r, [field]: value } : r
            ),
        }));
    }

    function addIngredientRow() {
        setRecipe((prev) => ({
            ...prev,
            ingredientsRows: [...prev.ingredientsRows, newIngredientRow()],
        }));
    }

    function removeIngredientRow(rowId) {
        setRecipe((prev) => ({
            ...prev,
            ingredientsRows: prev.ingredientsRows.filter((r) => r.id !== rowId),
        }));
    }

    /* ---------------- Save recipe ---------------- */

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);

        try {
            const ingredients = recipe.ingredientsRows
                .filter((r) => r.amount.trim() || r.name.trim())
                .map((r) => `${r.amount} ${r.name}`.trim())
                .join("\n");

            const payload = {
                id: recipe.id,
                title: recipe.title,
                description: recipe.description,
                ingredients,
                rawText: recipe.rawText,
                imageUrl: recipe.imageUrl, // ✅ explizit mitsenden
                categories: (recipe.categories ?? []).map((name) => ({ name })),
            };

            const res = await fetch(`http://localhost:8081/api/recipes/${recipe.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(msg || "Speichern fehlgeschlagen.");
            }

            navigate(`/recipes/${recipe.id}`);
        } catch (e2) {
            alert(e2?.message || "Speichern fehlgeschlagen.");
        } finally {
            setSaving(false);
        }
    }

    /* ---------------- Image upload (upload + PUT persist) ---------------- */

    async function handleImageUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            // 1) upload -> TEXT "/images/xyz.jpg"
            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await fetch("http://localhost:8081/api/uploads/image", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                const msg = await uploadRes.text().catch(() => "");
                throw new Error(msg || "Upload fehlgeschlagen.");
            }

            const imageUrl = (await uploadRes.text()).trim();
            if (!imageUrl) throw new Error("Upload lieferte keine imageUrl.");

            // 2) UI sofort aktualisieren + 3) Payload aus aktuellem State bauen
            let payload = null;

            setRecipe((prev) => {
                const next = { ...prev, imageUrl };

                const ingredients = next.ingredientsRows
                    .filter((r) => r.amount.trim() || r.name.trim())
                    .map((r) => `${r.amount} ${r.name}`.trim())
                    .join("\n");

                payload = {
                    id: next.id,
                    title: next.title,
                    description: next.description,
                    ingredients,
                    rawText: next.rawText,
                    imageUrl: next.imageUrl,
                    categories: (next.categories ?? []).map((name) => ({ name })),
                };

                return next;
            });

            if (!payload?.id) throw new Error("Rezept-ID fehlt – kann nicht speichern.");

            // 4) persist imageUrl via PUT
            const putRes = await fetch(`http://localhost:8081/api/recipes/${payload.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!putRes.ok) {
                const msg = await putRes.text().catch(() => "");
                throw new Error(msg || "Bild konnte nicht gespeichert werden (PUT).");
            }

            // 5) optional: Backend-Stand übernehmen
            const updated = await putRes.json();
            setRecipe((prev) => ({
                ...prev,
                imageUrl: updated.imageUrl || prev.imageUrl,
            }));
        } catch (err) {
            console.error(err);
            alert(err.message || "Bild-Upload fehlgeschlagen");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    const imgSrc = recipe.imageUrl ? toImageSrc(recipe.imageUrl) : placeholderFromTitle(recipe.title);

    /* ---------------- UI ---------------- */

    return (
        <div className="page">
            <h2>Rezept bearbeiten</h2>

            <form className="edit-form" onSubmit={handleSubmit}>
                {/* Titel */}
                <label htmlFor="titel">Titel</label>
                <input
                    id="titel"
                    value={recipe.title}
                    onChange={(e) => updateField("title", e.target.value)}
                />

                {/* Bild Upload + Vorschau */}
                <div style={{ marginBottom: "1rem" }}>
                    <label>
                        Rezeptbild:
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            style={{ display: "block", marginTop: "0.5rem" }}
                        />
                    </label>

                    <img
                        src={imgSrc}
                        alt={recipe.title ? `Bild zu ${recipe.title}` : "Rezeptbild"}
                        style={{
                            marginTop: "0.75rem",
                            width: "100%",
                            maxWidth: "520px",
                            borderRadius: "12px",
                            display: "block",
                            objectFit: "cover",
                        }}
                    />

                    {uploading && <p style={{ marginTop: "0.5rem" }}>Bild wird hochgeladen…</p>}
                </div>

                {/* Kategorien */}
                <label htmlFor="kategorien">Kategorien</label>
                <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
                    {categoryNames.map((cat) => (
                        <label key={cat} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                            <input
                                type="checkbox"
                                checked={recipe.categories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                            />
                            {cat}
                        </label>
                    ))}
                </div>

                {/* Beschreibung */}
                <label htmlFor="beschreibung">Beschreibung</label>
                <textarea
                    id="beschreibung"
                    value={recipe.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={5}
                    style={{ width: "100%", marginBottom: "1rem" }}
                />

                {/* Zutaten */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
                    <thead>
                        <tr>
                            <th style={{ borderBottom: "1px solid #ccc" }}>Menge</th>
                            <th style={{ borderBottom: "1px solid #ccc" }}>Zutat</th>
                            <th style={{ borderBottom: "1px solid #ccc" }}>Aktion</th>
                        </tr>
                    </thead>

                    <tbody>
                        {recipe.ingredientsRows.map((row) => (
                            <tr key={row.id}>
                                <td>
                                    <input
                                        type="text"
                                        value={row.amount}
                                        onChange={(e) => updateIngredientRow(row.id, "amount", e.target.value)}
                                        style={{ width: "90px" }}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={row.name}
                                        onChange={(e) => updateIngredientRow(row.id, "name", e.target.value)}
                                        style={{ width: "100%" }}
                                    />
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => removeIngredientRow(row.id)}
                                        style={{ padding: "0.25rem 0.6rem" }}
                                    >
                                        Entfernen
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button type="button" onClick={addIngredientRow} style={{ marginBottom: "1rem" }}>
                    + Zutat hinzufügen
                </button>

                {/* Aktionen */}
                <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                    <button className="btn primary" type="submit" disabled={saving}>
                        {saving ? "Speichert…" : "Speichern"}
                    </button>

                    <button
                        className="btn secondary"
                        type="button"
                        onClick={() => navigate(`/recipes/${recipe.id}`)}
                    >
                        Abbrechen
                    </button>
                </div>
            </form>
        </div>
    );
}

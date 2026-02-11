import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";

const API_BASE = "http://localhost:8081";

/* -------------------------------------------------------------
   Helper
------------------------------------------------------------- */

function getCategoryLabel(c) {
    return typeof c === "string" ? c : c?.name ?? "";
}

function normalizeCategories(categories) {
    return (categories ?? [])
        .map((c) => (typeof c === "string" ? c : c?.name))
        .filter(Boolean);
}

/**
 * Single source of truth: recipe.imageUrl (DB)
 * - If absolute: use as-is
 * - If relative ("/images/..."): prefix backend host
 * - UI fallback: placeholder
 */
function getRecipeImageUrl(recipe) {
    const url = recipe?.imageUrl?.trim();
    if (url) return url.startsWith("http") ? url : `${API_BASE}${url}`;

    const encoded = encodeURIComponent(recipe?.title || "Rezept");
    return `https://placehold.co/800x500?text=${encoded}`;
}

function parseIngredients(ingredients) {
    if (!ingredients) return [];
    return ingredients
        .split("\n")
        .map((line) => line
            .replace(/^\s*[-•*]\s*/, "")
            .trim())
        .filter(Boolean);
}

/* -------------------------------------------------------------
   UI Components
------------------------------------------------------------- */

function CategoryBadge({ label, color, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Nach Kategorie filtern: ${label}`}
            style={{
                background: color || "#999",
                color: "white",
                padding: "2px 10px",
                borderRadius: 999,
                fontSize: "0.75rem",
                border: "none",
                cursor: "pointer",
                lineHeight: 1.8,
            }}
        >
            {label}
        </button>
    );
}

CategoryBadge.propTypes = {
    label: PropTypes.string.isRequired,
    color: PropTypes.string,
    onClick: PropTypes.func.isRequired,
};

/* -------------------------------------------------------------
   Page
------------------------------------------------------------- */

export default function Recipes() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // Category color lookup (optional)
    const categoryColorByName = useMemo(() => {
        const map = new Map();
        (CATEGORIES || []).forEach((c) => {
            const name = getCategoryLabel(c);
            const color = typeof c === "object" ? c?.color : undefined;
            if (name) map.set(name, color);
        });
        return map;
    }, []);

    // Load recipe
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
            } catch (err) {
                if (!ignore) setError(err?.message || "Fehler beim Laden.");
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        load();
        return () => {
            ignore = true;
        };
    }, [id]);

    // Upload image and persist imageUrl
    async function handleImageUpload(file) {
        if (!file) return;
        if (!recipe?.id) return;

        setError("");
        setBusy(true);

        try {
            const fd = new FormData();
            fd.append("file", file);

            // 1) Upload
            const upRes = await fetch(`${API_BASE}/api/recipes/${recipe.id}/image`, {
                method: "POST",
                body: fd,
            });

            if (!upRes.ok) {
                const text = await upRes.text().catch(() => "");
                throw new Error(text || `Upload fehlgeschlagen (HTTP ${upRes.status})`);
            }

            // Backend liefert bei dir einen String wie "/images/xyz.jpg"
            const imageUrl = await upRes.text();
            const cleanImageUrl = (imageUrl || "").replaceAll('"', "").trim();

            // 2) Persist imageUrl via PUT (alle Felder mitsenden, die RecipeController erwartet)
            //    -> wir nehmen das aktuell geladene recipe als Basis.
            const payload = {
                ...recipe,
                imageUrl: cleanImageUrl,
                // Categories in der Form, wie dein Backend sie mag: [{name:"..."}]
                categories: normalizeCategories(recipe.categories).map((name) => ({ name })),
            };

            const putRes = await fetch(`${API_BASE}/api/recipes/${recipe.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!putRes.ok) {
                const text = await putRes.text().catch(() => "");
                throw new Error(text || `Speichern fehlgeschlagen (HTTP ${putRes.status})`);
            }

            const updated = await putRes.json().catch(() => null);

            // Local state aktualisieren (robust)
            setRecipe((prev) => ({
                ...(updated || prev),
                imageUrl: (updated?.imageUrl ?? cleanImageUrl),
            }));
        } catch (err) {
            setError(err?.message || "Fehler beim Bild-Upload.");
        } finally {
            setBusy(false);
        }
    }

    function handleFilterByCategory(label) {
        navigate(`/recipes?category=${encodeURIComponent(label)}`);
    }

    if (loading) {
        return (
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
                <p>Lade Rezept…</p>
            </div>
        );
    }

    if (!recipe) {
        return (
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
                <h1>Rezept</h1>
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
                    {error || "Rezept nicht gefunden."}
                </div>
                <div style={{ marginTop: 12 }}>
                    <button className="btn" onClick={() => navigate("/recipes")}>
                        Zurück zur Liste
                    </button>
                </div>
            </div>
        );
    }

    const categories = normalizeCategories(recipe.categories);
    const imageSrc = getRecipeImageUrl(recipe);

/* -------------------------------------------------------------
   Render
------------------------------------------------------------- */    
    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
            {/* 1) Title + Kategorien + Actions */}
            <div style={{ display: "flex", alignItems: "start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 520px" }}>
                    <h1 style={{ margin: 0 }}>{recipe.title}</h1>
                </div>
            </div>

            {/* Error */}
            {error ? (
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
            ) : null}

            {/* 2) Image + Upload */}
            <div style={{ marginTop: 14 }}>
                <img
                    src={imageSrc}
                    alt={recipe.title}
                    style={{
                        width: "100%",
                        maxHeight: 420,
                        objectFit: "cover",
                        borderRadius: 12,
                        display: "block",
                    }}
                />

                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>Bild hochladen</span>
                        <input
                            type="file"
                            accept="image/*"
                            disabled={busy}
                            onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                        />
                    </label>

                    {busy ? (
                        <span style={{ fontSize: 12, opacity: 0.7, alignSelf: "end" }}>
                            Arbeite…
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Kategorien */}
            {categories.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                        }}
                    >
                        {categories.map((label) => (
                            <CategoryBadge
                                key={label}
                                label={label}
                                color={categoryColorByName.get(label)}
                                onClick={() => handleFilterByCategory(label)}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <p style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
                    Keine Kategorie
                </p>
            )}

            {/* Ingredients */}
            {recipe.ingredients ? (
                <div style={{ marginTop: 16 }}>
                    <h3 style={{ marginBottom: 8 }}>Zutaten</h3>
                    <ul
                        style={{
                            margin: 0,
                            padding: 12,
                            borderRadius: 10,
                            background: "#f6f6f6",
                            whiteSpace: "pre-wrap",
                            fontFamily: "inherit",
                            textAlign: "left",
                            fontSize: 14,

                        }}>
                        {parseIngredients(recipe.ingredients).map((ingredient) => (
                            <li key={ingredient}>{ingredient}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {/* Description */}
            {recipe.description ? (
                <div style={{ marginTop: 16 }}>
                    <h3 style={{ marginBottom: 8 }}>Beschreibung</h3>
                    <p style={{ marginTop: 0, whiteSpace: "pre-wrap", textAlign: "left" }}>{recipe.description}</p>
                </div>
            ) : null}

            {/* Details */}
            <div style={{ marginTop: 16 }}>
                <h3 style={{ marginBottom: 8 }}>Details</h3>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 12,
                    }}
                >
                    <Meta label="Schwierigkeit" value={recipe.difficultyLevel} />
                    <Meta label="Zubereitungszeit (Min.)" value={recipe.prepTimeMinutes} />
                    <Meta label="Kochzeit (Min.)" value={recipe.cookTimeMinutes} />
                    <Meta label="Portionen" value={recipe.servings} />
                    <Meta label="Kalorien" value={recipe.calories} />
                    <Meta label="Bewertung" value={recipe.rating} />
                    <Meta label="Protein (g)" value={recipe.protein} />
                    <Meta label="Kohlenhydrate (g)" value={recipe.carbohydrates} />
                    <Meta label="Fett (g)" value={recipe.fats} />
                </div>
            </div>


            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                    className="btn primary"
                    onClick={() => navigate(`/recipes/edit/${recipe.id}`)}
                >
                    Bearbeiten
                </button>

                <button className="btn" onClick={() => navigate("/recipes")}>
                    Zurück
                </button>
                <button onClick={() => window.open(`http://localhost:8081/api/recipes/${recipe.id}/pdf`, "_blank")} className="btn">
                    PDF herunterladen
                </button>
            </div>

        </div>
    );

}

function Meta({ label, value }) {
    const display =
        value === null || value === undefined || value === "" ? "—" : String(value);

    return (
        <div
            style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                background: "white",
            }}
        >
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{label}</div>
            <div style={{ fontWeight: 600 }}>{display}</div>
        </div>
    );
}

Meta.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
};
/* -------------------------------------------------------------
   Ende
------------------------------------------------------------- */
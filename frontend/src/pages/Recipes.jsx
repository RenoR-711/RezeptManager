import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";

const API_BASE = "http://localhost:8081";
const PLACEHOLDER_BASE = "https://placehold.co/800x500?text=";

/* -------------------------------------------------------------
   Helper Functions
------------------------------------------------------------- */

/**
 * Gibt den lesbaren Kategorienamen zurück.
 * Unterstützt sowohl Strings als auch Objekt-Formate.
 */
function getCategoryLabel(category) {
    return typeof category === "string" ? category : category?.name ?? "";
}

/**
 * Normalisiert Kategorien in ein sauberes String-Array.
 */
function normalizeCategories(categories) {
    return (categories ?? [])
        .map((category) => getCategoryLabel(category))
        .filter(Boolean);
}

/**
 * Liefert die Bild-URL für ein Rezept.
 * - Absolute URL: direkt verwenden
 * - Relative URL: Backend-Host voranstellen
 * - Kein Bild: Placeholder verwenden
 */
function getRecipeImageUrl(recipe) {
    const rawUrl = recipe?.imageUrl?.trim();

    if (rawUrl) {
        return rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`;
    }

    const encodedTitle = encodeURIComponent(recipe?.title || "Rezept");
    return `${PLACEHOLDER_BASE}${encodedTitle}`;
}

/**
 * Wandelt Zutaten-Text in eine Liste um.
 * Entfernt typische Aufzählungszeichen.
 */
function parseIngredients(ingredients) {
    if (!ingredients) return [];

    if (Array.isArray(ingredients)) {
        return ingredients
            .map((item) => {
                if (!item) return "";

                if (typeof item === "string") {
                    return item.trim();
                }

                const amount = item.amount ?? "";
                const amountWord = item.amountWord ?? item.Amount_Word ?? item.unit ?? "";
                const ingredientName =
                    item.name ??
                    item.ingredientName ??
                    item.ingredient?.name ??
                    "";

                return [amount, amountWord, ingredientName]
                    .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
                    .join(" ")
                    .trim();
            })
            .filter(Boolean);
    }

    if (typeof ingredients === "string") {
        return ingredients
            .split("\n")
            .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
            .filter(Boolean);
    }

    return [];
}

/**
 * Baut eine Farbzuordnung für Kategorien auf.
 */
function buildCategoryColorMap(categories) {
    const map = new Map();

    (categories || []).forEach((category) => {
        const name = getCategoryLabel(category);
        const color = typeof category === "object" ? category?.color : undefined;

        if (name) map.set(name, color);
    });

    return map;
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
                background: color || "#888",
                color: "#fff",
                padding: "4px 10px",
                borderRadius: 999,
                border: "none",
                fontSize: "0.75rem",
                lineHeight: 1.6,
                cursor: "pointer",
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

function Meta({ label, value }) {
    const displayValue =
        value === null || value === undefined || value === "" ? "—" : String(value);

    return (
        <div
            style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                background: "#fff",
            }}
        >
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{label}</div>
            <div style={{ fontWeight: 600 }}>{displayValue}</div>
        </div>
    );
}

Meta.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
};

/* -------------------------------------------------------------
   Main Page Component
------------------------------------------------------------- */

export default function Recipes() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const categoryColorByName = useMemo(() => {
        return buildCategoryColorMap(CATEGORIES);
    }, []);

    const categories = useMemo(() => {
        return normalizeCategories(recipe?.categories);
    }, [recipe]);

    const imageSrc = useMemo(() => {
        return getRecipeImageUrl(recipe);
    }, [recipe]);

    const ingredientLines = useMemo(() => {
        return parseIngredients(recipe?.ingredients);
    }, [recipe]);

    /* ---------------------------------------------------------
       Data Loading
    --------------------------------------------------------- */
    useEffect(() => {
        let ignore = false;

        async function loadRecipe() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(`${API_BASE}/api/recipes/${id}`);

                if (!response.ok) {
                    const text = await response.text().catch(() => "");
                    throw new Error(text || `Rezept nicht gefunden (HTTP ${response.status})`);
                }

                const data = await response.json();

                if (!ignore) {
                    setRecipe(data);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err?.message || "Fehler beim Laden des Rezepts.");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadRecipe();

        return () => {
            ignore = true;
        };
    }, [id]);

    /* ---------------------------------------------------------
       Image Upload
    --------------------------------------------------------- */
    async function handleImageUpload(file) {
        if (!file || !recipe?.id) return;

        setBusy(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            // 1) Bild hochladen
            const uploadResponse = await fetch(`${API_BASE}/api/recipes/${recipe.id}/image`, {
                method: "POST",
                body: formData,
            });

            if (!uploadResponse.ok) {
                const text = await uploadResponse.text().catch(() => "");
                throw new Error(text || `Upload fehlgeschlagen (HTTP ${uploadResponse.status})`);
            }

            const uploadedImageUrl = await uploadResponse.text();
            const cleanImageUrl = (uploadedImageUrl || "").replaceAll('"', "").trim();

            // 2) Rezept mit neuer imageUrl speichern
            const payload = {
                ...recipe,
                imageUrl: cleanImageUrl,
                categories: normalizeCategories(recipe.categories).map((name) => ({ name })),
            };

            const updateResponse = await fetch(`${API_BASE}/api/recipes/${recipe.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!updateResponse.ok) {
                const text = await updateResponse.text().catch(() => "");
                throw new Error(text || `Speichern fehlgeschlagen (HTTP ${updateResponse.status})`);
            }

            const updatedRecipe = await updateResponse.json().catch(() => null);

            setRecipe((prev) => ({
                ...(updatedRecipe || prev),
                imageUrl: updatedRecipe?.imageUrl ?? cleanImageUrl,
            }));
        } catch (err) {
            setError(err?.message || "Fehler beim Bild-Upload.");
        } finally {
            setBusy(false);
        }
    }

    /* ---------------------------------------------------------
       Navigation Actions
    --------------------------------------------------------- */
    function handleFilterByCategory(label) {
        navigate(`/recipes?category=${encodeURIComponent(label)}`);
    }

    function handleEdit() {
        navigate(`/recipes/edit/${recipe.id}`);
    }

    function handleBack() {
        navigate("/recipes");
    }

    function handlePdfDownload() {
        window.open(`${API_BASE}/api/recipes/${recipe.id}/pdf`, "_blank");
    }

    /* ---------------------------------------------------------
       Render States
    --------------------------------------------------------- */
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
                    <button className="btn" onClick={handleBack}>
                        Zurück zur Liste
                    </button>
                </div>
            </div>
        );
    }

    /* ---------------------------------------------------------
       Main Render
    --------------------------------------------------------- */
    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
            {/* Titel */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 520px" }}>
                    <h1 style={{ margin: 0 }}>{recipe.title}</h1>
                </div>
            </div>

            {/* Fehlermeldung */}
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

            {/* Bild + Upload */}
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
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                    Keine Kategorie vorhanden
                </p>
            )}

            {/* Zutaten */}
            {ingredientLines.length > 0 ? (
                <div style={{ marginTop: 16 }}>
                    <h3 style={{ marginBottom: 8 }}>Zutaten</h3>
                    <ul
                        style={{
                            margin: 0,
                            padding: 12,
                            borderRadius: 10,
                            background: "#f6f6f6",
                            fontSize: 14,
                            textAlign: "left",
                        }}
                    >
                        {ingredientLines.map((ingredient, index) => (
                            <li key={`${ingredient}-${index}`}>{ingredient}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {/* Beschreibung */}
            {recipe.description ? (
                <div style={{ marginTop: 16 }}>
                    <h3 style={{ marginBottom: 8 }}>Beschreibung</h3>
                    <p style={{ marginTop: 0, whiteSpace: "pre-wrap", textAlign: "left" }}>
                        {recipe.description}
                    </p>
                </div>
            ) : null}

            {/* Metadaten */}
            <div style={{ marginTop: 16 }}>
                <h3 style={{ marginBottom: 8 }}>Details</h3>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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

            {/* Aktionen */}
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <button className="btn primary" onClick={handleEdit}>
                    Bearbeiten
                </button>

                <button className="btn" onClick={handleBack}>
                    Zurück
                </button>

                <button className="btn" onClick={handlePdfDownload}>
                    PDF herunterladen
                </button>
                
            </div>
        </div>
    );
}
/* -------------------------------------------------------------
   Ende
------------------------------------------------------------- */
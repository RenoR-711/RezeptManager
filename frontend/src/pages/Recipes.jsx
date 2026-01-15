import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";

/* -------------------------------------------------------------
   Helper
------------------------------------------------------------- */

function getCategoryLabel(c) {
    return typeof c === "string" ? c : c?.name ?? "";
}

/**
 * Single source of truth: recipe.imageUrl (DB)
 * - If absolute: use as-is
 * - If relative ("/images/..."): prefix backend host
 * - UI safety fallback: placeholder with title (should rarely happen if backend guarantees imageUrl)
 */
function getRecipeImageUrl(recipe) {
    const url = recipe?.imageUrl?.trim();
    if (url) {
        return url.startsWith("http") ? url : `http://localhost:8081${url}`;
    }
    const encoded = encodeURIComponent(recipe?.title || "Rezept");
    return `https://placehold.co/800x500?text=${encoded}`;
}

/* -------------------------------------------------------------
   Components
------------------------------------------------------------- */

function CategoryBadge({ category, color }) {
    const navigate = useNavigate();
    const label = getCategoryLabel(category);

    function handleClick() {
        navigate(`/recipes?category=${encodeURIComponent(label)}`);
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={`Nach Kategorie filtern: ${label}`}
            style={{
                background: color || "#999",
                color: "white",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.7rem",
                border: "none",
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    );
}

CategoryBadge.propTypes = {
    category: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            name: PropTypes.string,
        }),
    ]).isRequired,
    color: PropTypes.string,
};

/* -------------------------------------------------------------
   Page
------------------------------------------------------------- */

export default function Recipes() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const badgeColors = useMemo(
        () => Object.fromEntries(CATEGORIES.map((c) => [c.name, c.color])),
        []
    );

    useEffect(() => {
        let isMounted = true;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`http://localhost:8081/api/recipes/${id}`);
                if (!res.ok) throw new Error("Rezept konnte nicht geladen werden.");
                const data = await res.json();
                if (isMounted) setRecipe(data);
            } catch (e) {
                if (isMounted) {
                    setRecipe(null);
                    setError(e?.message || "Unbekannter Fehler beim Laden.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        load();
        return () => {
            isMounted = false;
        };
    }, [id]);

    async function deleteRecipe() {
        if (!globalThis.confirm("Rezept wirklich löschen?")) return;

        try {
            const res = await fetch(`http://localhost:8081/api/recipes/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Löschen fehlgeschlagen.");
            navigate("/recipes");
        } catch (e) {
            globalThis.alert(e?.message || "Löschen fehlgeschlagen.");
        }
    }

    async function handleImageUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            // 1) Upload -> TEXT: "/images/xyz.jpg"
            const uploadRes = await fetch("http://localhost:8081/api/uploads/image", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                const msg = await uploadRes.text().catch(() => "");
                throw new Error(msg || "Upload fehlgeschlagen");
            }

            const imageUrl = (await uploadRes.text()).trim();
            if (!imageUrl) throw new Error("Upload lieferte keine imageUrl");

            // 2) Payload aus dem AKTUELLEN State bauen (kein stale closure)
            let payload = null;

            setRecipe((prev) => {
                const next = { ...prev, imageUrl };

                payload = {
                    id: next.id,
                    title: next.title,
                    description: next.description,
                    ingredients: next.ingredients,
                    rawText: next.rawText,
                    imageUrl: next.imageUrl,
                    categories: (next.categories ?? []).map((c) => ({
                        name: typeof c === "string" ? c : c?.name,
                    })),
                };

                return next;
            });

            if (!payload?.id) throw new Error("Rezept-ID fehlt – kann nicht speichern.");

            // 3) Persistieren in DB via PUT
            const putRes = await fetch(`http://localhost:8081/api/recipes/${payload.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!putRes.ok) {
                const msg = await putRes.text().catch(() => "");
                throw new Error(msg || "Bild konnte nicht gespeichert werden (PUT).");
            }

            // 4) Backend-Stand übernehmen (damit Hauptbild + DB 100% synchron sind)
            const updated = await putRes.json();
            setRecipe(updated);
        } catch (err) {
            console.error(err);
            alert(err.message || "Bild-Upload fehlgeschlagen");
        } finally {
            setUploading(false);
            e.target.value = ""; // erlaubt erneut dieselbe Datei zu wählen
        }
    }

    if (loading) return <div className="loader">Rezept wird geladen…</div>;
    if (error) return <p style={{ color: "crimson" }}>{error}</p>;
    if (!recipe) return <p>Rezept nicht gefunden.</p>;

    return (
        <div className="page">
            {/* Header */}
            <header className="recipe-header">
                <button className="back-btn" onClick={() => navigate(-1)} type="button">
                    ← Zurück
                </button>
                <h1>{recipe.title}</h1>
            </header>

            {/* Hauptbereich */}
            <section className="recipe-main">
                {/* Bild + Kategorien */}
                <div className="recipe-image" style={{ marginBottom: "1rem" }}>
                    <img
                        src={getRecipeImageUrl(recipe)}
                        alt={recipe?.title ? `Bild zu ${recipe.title}` : "Rezeptbild"}
                        style={{
                            width: "100%",
                            maxWidth: "800px",
                            height: "auto",
                            borderRadius: "12px",
                            display: "block",
                            objectFit: "cover",
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.35rem",
                            marginTop: "0.6rem",
                            alignItems: "center",
                        }}
                    >
                        {(recipe.categories ?? []).map((c) => {
                            const label = getCategoryLabel(c);
                            return (
                                <CategoryBadge key={label} category={c} color={badgeColors[label]} />
                            );
                        })}
                    </div>

                    {/* Upload */}
                    <label style={{ display: "block", marginTop: "0.9rem" }}>
                        Rezeptbild:
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            style={{ display: "block", marginTop: "0.5rem" }}
                        />
                    </label>

                    {uploading && <p style={{ marginTop: "0.5rem" }}>Bild wird hochgeladen…</p>}
                </div>

                {/* Zutaten */}
                <div className="recipe-ingredients">
                    <h3>Zutaten</h3>
                    <ul className="ingredients-box">
                        {recipe.ingredients
                            ?.split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .map((line, i) => (
                                <li key={`${line}-${i}`}>{line}</li>
                            ))}
                    </ul>
                </div>
            </section>

            {/* Zubereitung */}
            <section className="recipe-description">
                <h3 style={{ textAlign: "left" }}>Zubereitung</h3>
                {recipe.description
                    ?.split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                        <p key={`${line}-${i}`}>{line}</p>
                    ))}
            </section>

            {/* Aktionen */}
            <footer className="recipe-actions">
                <button
                    className="btn primary"
                    type="button"
                    onClick={() => navigate(`/recipes/edit/${recipe.id}`)}
                >
                    Bearbeiten
                </button>

                <button className="btn danger" type="button" onClick={deleteRecipe}>
                    Löschen
                </button>

                <button
                    className="btn secondary"
                    type="button"
                    onClick={() =>
                        globalThis.open(`http://localhost:8081/api/recipes/${id}/pdf`, "_blank")
                    }
                >
                    PDF
                </button>
            </footer>
        </div>
    );
}

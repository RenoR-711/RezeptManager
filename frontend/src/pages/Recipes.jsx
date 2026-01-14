import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";

/* -------------------------------------------------------------
   Hilfsfunktionen
------------------------------------------------------------- */
function getCategoryLabel(c) {
    return typeof c === "string" ? c : c?.name ?? "";
}

function getRecipeImageUrl(recipe) {
    // 1) Neues Feld aus Upload/Scan/Edit (z.B. "/images/xyz.jpg" oder volle URL)
    if (recipe?.imageUrl) {
        return recipe.imageUrl.startsWith("http")
            ? recipe.imageUrl
            : `http://localhost:8081${recipe.imageUrl}`;
    }

    // 2) Altes Feld aus deinem bisherigen Upload-System
    if (recipe?.sourceFile) {
        return `http://localhost:8081/uploads/${recipe.sourceFile}`;
    }

    // 3) Dummy / Placeholder
    const encoded = encodeURIComponent(recipe?.title || "Rezept");
    return `https://placehold.co/800x500?text=${encoded}`;
}

/* -------------------------------------------------------------
   Ausgelagerte Komponente
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
   Hauptkomponente
------------------------------------------------------------- */
export default function Recipes() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
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

        const formData = new FormData();
        formData.append("file", file);

        try {
            // 1) Upload
            const uploadRes = await fetch("http://localhost:8081/api/uploads/image", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Upload fehlgeschlagen");

            // 2) Antwort robust parsen (JSON ODER Text)
            const contentType = uploadRes.headers.get("content-type") || "";
            let imageUrl;

            if (contentType.includes("application/json")) {
                const data = await uploadRes.json();
                imageUrl =
                    data.imageUrl ?? data.url ?? data.path ?? data.location ?? "";
            } else {
                imageUrl = (await uploadRes.text()).trim();
            }

            if (!imageUrl) throw new Error("Upload ok, aber keine Bild-URL erhalten.");

            // 3) URL normalisieren (führender Slash)
            if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
                imageUrl = `/${imageUrl}`;
            }

            // 4) UI sofort updaten (damit du sofort siehst ob src stimmt)
            setRecipe((prev) => (prev ? { ...prev, imageUrl } : prev));

            // 5) In DB speichern (PUT) - minimaler Payload (falls Backend das akzeptiert)
            const recipeId = recipe?.id;
            const saveRes = await fetch(`http://localhost:8081/api/recipes/${recipeId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...recipe, imageUrl }),
            });

            if (!saveRes.ok) throw new Error("Bild konnte nicht gespeichert werden (PUT).");

            // 6) Frisch laden (wichtig: wenn Backend Felder normalisiert)
            const updated = await saveRes.json();
            setRecipe(updated);
        } catch (err) {
            console.error(err);
            globalThis.alert(err?.message || "Bild-Upload fehlgeschlagen");
        } finally {
            e.target.value = "";
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
                                <CategoryBadge
                                    key={label}
                                    category={c}
                                    color={badgeColors[label]}
                                />
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
                            style={{ display: "block", marginTop: "0.5rem" }}
                        />
                    </label>
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
                        globalThis.open(
                            `http://localhost:8081/api/recipes/${id}/pdf`,
                            "_blank"
                        )
                    }
                >
                    PDF
                </button>
            </footer>
        </div>
    );
}

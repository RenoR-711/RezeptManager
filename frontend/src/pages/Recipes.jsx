import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";
/* -------------------------------------------------------------
   Hilfsfunktionen
------------------------------------------------------------- */
function getCategoryLabel(c) {
    return typeof c === "string" ? c : c?.name ?? "";
}
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
/* -------------------------------------------------------------
   Hauptkomponente
------------------------------------------------------------- */
export default function Recipes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const badgeColors = Object.fromEntries(
        CATEGORIES.map(c => [c.name, c.color])
    );
    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8081/api/recipes/${id}`)
            .then((res) => res.json())
            .then((data) => {
                setRecipe(data);
                setLoading(false);
            });
    }, [id]);
    function deleteRecipe() {
        if (!globalThis.confirm("Rezept wirklich löschen?")) return;
        fetch(`http://localhost:8081/api/recipes/${id}`, { method: "DELETE" })
            .then(() => navigate("/recipes"));
    }
    if (loading) {
        return <div className="loader">Rezept wird geladen…</div>;
    }
    if (!recipe) {
        return <p>Rezept nicht gefunden.</p>;
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
            const imageUrl = await res.json();
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
    CategoryBadge.propTypes = {
        category: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                id: PropTypes.number,
                name: PropTypes.string,
            }),
        ]).isRequired,
        color: PropTypes.string,
    };
    /* ---------------- UI ---------------- */
    return (
        <div className="page">
            {/* Header */}
            <header className="recipe-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Zurück
                </button>
                <h1>{recipe.title}</h1>
            </header>
            {/* Hauptbereich */}
            <section className="recipe-main">
                {/* Bild */}
                <div className="recipe-image">
                    <img src={recipe.imageUrl} alt={recipe.title} />
                    {recipe.categories.map((c) => {
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
                
                {/* Zutaten */}
                <div className="recipe-ingredients">
                    <h3>Zutaten</h3>
                    <ul className="ingredients-box">
                        {recipe.ingredients
                            ?.split("\n")
                            .map(line => line.trim())
                            .filter(Boolean)
                            .map((line) => (
                                <li key={line}>{line}</li>
                            ))}
                    </ul>
                </div>
            </section>
            {/* Zubereitung */}
            <section className="recipe-description">
                <h3 style={{ textAlign: "left" }}>Zubereitung</h3>
                {recipe.description
                    ?.split("\n")
                    .filter(Boolean)
                    .map((line) => (
                        <p key={line}>{line}</p>
                    ))}
            </section>
            {/* Aktionen */}
            <footer className="recipe-actions">
                <button
                    className="btn primary"
                    onClick={() => navigate(`/recipes/edit/${recipe.id}`)}
                >
                    Bearbeiten
                </button>
                <button className="btn danger" onClick={deleteRecipe}>
                    Löschen
                </button>
                <button
                    className="btn secondary"
                    onClick={() =>
                        window.open(
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

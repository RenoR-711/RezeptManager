import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";
import CategoryBadge from "../components/CategoryBadge";
import RecipeMeta from "../components/RecipeMeta";
import {buildCategoryColorMap, getRecipeImageUrl, normalizeCategories, parseIngredients} from "../utils/recipeHelpers";

const API_BASE = "http://localhost:8081";
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
            <div className="recipe-page recipe-page--empty">
                <h1>Rezept</h1>

                <div
                    className="recipe-alert"
                    role="alert">
                    {error || "Rezept nicht gefunden."}
                </div>

                <div className="recipe-actions">
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
        <div className="recipe-page">
            {/* Titel */}
            <div className="recipe-header">
                <div className="recipe-header-content">
                    <h1 className="recipe-title">{recipe.title}</h1>
                </div>
            </div>

            {/* Fehlermeldung */}
            {error ? (
                <div role="alert" className="recipe-alert">
                    {error}
                </div>
            ) : null}

            {/* Bild + Upload */}
            <div className="recipe-image-section">
                <img
                    src={imageSrc}
                    alt={recipe.title}
                    className="recipe-image"
                />

                <div className="recipe-image-actions">
                    <label className="recipe-upload-label">
                        <span className="recipe-upload-text">Bild hochladen</span>
                        <input
                            type="file"
                            accept="image/*"
                            disabled={busy}
                            onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                        />
                    </label>

                    {busy ? (
                        <span className="recipe-busy-text">
                            Arbeite…
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Kategorien */}
            {categories.length > 0 ? (
                <div className="recipe-categories">
                    <div className="recipe-category-list">
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
                <p className="recipe-category-empty">
                    Keine Kategorie vorhanden
                </p>
            )}

            {/* Zutaten */}
            {ingredientLines.length > 0 ? (
                <div className="recipe-section">
                    <h3 className="recipe-section-title">Zutaten</h3>
                    <ul className="recipe-ingredients-list">
                        {ingredientLines.map((ingredient, index) => (
                            <li key={`${ingredient}-${index}`}>{ingredient}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {/* Beschreibung */}
            {recipe.description ? (
                <div className="recipe-section">
                    <h3 className="recipe-section-title">Beschreibung</h3>
                    <p className="recipe-description">{recipe.description}
                    </p>
                </div>
            ) : null}

            {/* RecipeMeta daten */}
            <div className="recipe-section">
                <h3 className="recipe-section-title">Details</h3>

                <div className="recipe-meta-grid" >
                    <RecipeMeta label="Schwierigkeit" value={recipe.difficultyLevel} />
                    <RecipeMeta label="Zubereitungszeit (Min.)" value={recipe.prepTimeMinutes} />
                    <RecipeMeta label="Kochzeit (Min.)" value={recipe.cookTimeMinutes} />
                    <RecipeMeta label="Portionen" value={recipe.servings} />
                    <RecipeMeta label="Kalorien" value={recipe.calories} />
                    <RecipeMeta label="Protein (g)" value={recipe.protein} />
                    <RecipeMeta label="Kohlenhydrate (g)" value={recipe.carbohydrates} />
                    <RecipeMeta label="Fett (g)" value={recipe.fats} />
                    <RecipeMeta label="Bewertung" value={recipe.rating} />
                </div>
            </div>

            {/* Aktionen */}
            <div className="recipe-edit">
                <button className="edit" onClick={handleEdit}>
                    Bearbeiten
                </button>

                <button className="cancel" onClick={handleBack}>
                    Zurück
                </button>

                <button className="secondary" onClick={handlePdfDownload}>
                    PDF
                </button>

            </div>
        </div>
    );
}
/* -------------------------------------------------------------
   Ende
------------------------------------------------------------- */
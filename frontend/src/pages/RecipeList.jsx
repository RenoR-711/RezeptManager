import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";

/* =============================================================
   Constants
============================================================= */

const API_BASE = "http://localhost:8081";
const RECIPES_API = `${API_BASE}/api/recipes`;
const FALLBACK_CATEGORY = "Ohne Kategorie";

/* =============================================================
   Helper Functions
============================================================= */

/**
 * Gibt den Kategorienamen zurück.
 * Unterstützt sowohl Strings als auch Objekte mit { name }.
 */
function getCategoryLabel(category) {
    return typeof category === "string" ? category : category?.name ?? "";
}

/**
 * Erzeugt die Bild-URL für ein Rezept.
 * - Absolute URLs bleiben unverändert
 * - Relative Pfade werden mit API_BASE ergänzt
 * - Fehlt ein Bild, wird ein Placeholder genutzt
 */
function getRecipeImageUrl(recipe) {
    const url = recipe?.imageUrl?.trim();

    if (url) {
        return url.startsWith("http") ? url : `${API_BASE}${url}`;
    }

    const encodedTitle = encodeURIComponent(recipe?.title || "Rezept");
    return `https://placehold.co/300x200?text=${encodedTitle}`;
}

/**
 * Extrahiert einen durchsuchbaren Zutaten-Text aus ausgelagerten Ingredients.
 * Erwartete Struktur pro Eintrag z. B.:
 * { name, amount, amountWord }
 */
function getIngredientSearchText(recipe) {
    return (recipe?.ingredients ?? [])
        .map((ingredient) => {
            const name = ingredient?.name ?? "";
            const amount = ingredient?.amount ?? "";
            const amountWord = ingredient?.amountWord ?? "";

            return `${amount} ${amountWord} ${name}`.trim();
        })
        .filter(Boolean)
        .join(" ");
}

/**
 * Normalisiert API-Daten für ein stabiles Frontend-Rendering.
 */
function normalizeRecipe(recipe) {
    return {
        ...recipe,
        title: recipe?.title ?? "",
        description: recipe?.description ?? "",
        ingredients: recipe?.ingredients ?? "",
        categories: recipe?.categories ?? [],
        imageUrl: recipe?.imageUrl ?? "",
        ingredients: Array.isArray(recipe?.ingredients) ? recipe.ingredients : [],
    };
}

/**
 * Gruppiert Rezepte nach Kategorien.
 * Rezepte ohne Kategorie landen in "Ohne Kategorie".
 */
function groupRecipesByCategory(recipes) {
    return recipes.reduce((groups, recipe) => {
        const categories = recipe.categories ?? [];

        if (categories.length === 0) {
            if (!groups[FALLBACK_CATEGORY]) {
                groups[FALLBACK_CATEGORY] = [];
            }
            groups[FALLBACK_CATEGORY].push(recipe);
            return groups;
        }

        categories.forEach((category) => {
            const label = getCategoryLabel(category) || FALLBACK_CATEGORY;

            if (!groups[label]) {
                groups[label] = [];
            }

            groups[label].push(recipe);
        });

        return groups;
    }, {});
}

/**
 * Initialisiert den Open/Closed-State der Gruppen.
 * Bei aktiver Suche werden alle Gruppen geöffnet.
 */
function createInitialOpenGroups(categoryNames, searchTerm) {
    const hasSearch = searchTerm.trim().length > 0;

    return categoryNames.reduce((acc, categoryName) => {
        acc[categoryName] = hasSearch;
        return acc;
    }, {});
}

/**
 * Sortiert Kategorien alphabetisch,
 * "Ohne Kategorie" bleibt immer am Ende.
 */
function sortCategoryNames(categoryNames) {
    return [...categoryNames].sort((a, b) => {
        if (a === FALLBACK_CATEGORY) return 1;
        if (b === FALLBACK_CATEGORY) return -1;
        return a.localeCompare(b);
    });
}

/* =============================================================
   UI Components
============================================================= */

function SearchBox({ value, onChange }) {
    return (
        <input
            type="text"
            placeholder="Suchen…"
            aria-label="Rezepte suchen"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
                marginBottom: "1rem",
            }}
        />
    );
}

SearchBox.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

function CategoryBadge({ category, color }) {
    const navigate = useNavigate();
    const label = getCategoryLabel(category);

    function handleClick(event) {
        event.preventDefault();
        event.stopPropagation();
        navigate(`/recipes?category=${encodeURIComponent(label)}`);
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={`Nach Kategorie filtern: ${label}`}
            style={{
                background: color || "#999",
                color: "#fff",
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

function RecipeCard({ recipe, onDelete, badgeColors }) {
    const categories = recipe.categories ?? [];

    return (
        <div
            style={{
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Link
                to={`/recipes/${recipe.id}`}
                style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    outlineOffset: "3px",
                    flexGrow: 1,
                }}
            >
                <img
                    src={getRecipeImageUrl(recipe)}
                    alt={recipe.title}
                    style={{
                        width: "100%",
                        height: "100px",
                        objectFit: "cover",
                    }}
                    loading="lazy"
                />

                <h4
                    style={{
                        textAlign: "center",
                        margin: "0.75rem 0 0.5rem",
                        padding: "0 0.5rem",
                    }}
                >
                    {recipe.title}
                </h4>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.3rem",
                        justifyContent: "center",
                        padding: "0 0.5rem 0.75rem",
                    }}
                >
                    {categories.map((category, index) => {
                        const label = getCategoryLabel(category);

                        return (
                            <CategoryBadge
                                key={`${recipe.id}-${label}-${index}`}
                                category={category}
                                color={badgeColors[label]}
                            />
                        );
                    })}
                </div>
            </Link>

            <button
                type="button"
                onClick={() => onDelete(recipe.id)}
                aria-label={`Rezept löschen: ${recipe.title}`}
                style={{
                    margin: "0.5rem",
                    background: "#d9534f",
                    color: "#fff",
                    border: "none",
                    padding: "0.45rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                }}
            >
                🗑️
            </button>
        </div>
    );
}

RecipeCard.propTypes = {
    recipe: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        title: PropTypes.string.isRequired,
        imageUrl: PropTypes.string,
        categories: PropTypes.array,
    }).isRequired,
    onDelete: PropTypes.func.isRequired,
    badgeColors: PropTypes.object.isRequired,
};

function RecipeGroup({
    category,
    recipes,
    open,
    onToggle,
    onDelete,
    badgeColors,
}) {
    return (
        <section style={{ marginBottom: "1.5rem" }}>
            <button
                type="button"
                onClick={() => onToggle(category)}
                aria-expanded={open}
                aria-label={`Kategorie ${category} ${open ? "schließen" : "öffnen"}`}
                style={{
                    background: "#eee",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    border: "none",
                }}
            >
                <span>{category}</span>
                <span>{open ? "▾" : "▸"}</span>
            </button>

            {open && (
                <div
                    style={{
                        marginTop: "0.8rem",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: "1rem",
                    }}
                >
                    {recipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            onDelete={onDelete}
                            badgeColors={badgeColors}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

RecipeGroup.propTypes = {
    category: PropTypes.string.isRequired,
    recipes: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
            title: PropTypes.string.isRequired,
            categories: PropTypes.array,
            imageUrl: PropTypes.string,
        })
    ).isRequired,
    open: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    badgeColors: PropTypes.object.isRequired,
};

/* =============================================================
   Main Component
============================================================= */

export default function RecipeList() {
    const [recipes, setRecipes] = useState([]);
    const [search, setSearch] = useState("");
    const [openGroups, setOpenGroups] = useState({});

    const location = useLocation();
    const navigate = useNavigate();

    const params = useMemo(
        () => new URLSearchParams(location.search),
        [location.search]
    );

    const selectedCategory = params.get("category") || "";

    const badgeColors = useMemo(() => {
        return Object.fromEntries(
            CATEGORIES.map((category) => [category.name, category.color])
        );
    }, []);

    /* -------------------------------------------------------------
       Data Loading
    ------------------------------------------------------------- */

    async function loadRecipes() {
        const response = await fetch(RECIPES_API);

        if (!response.ok) {
            throw new Error("Rezepte konnten nicht geladen werden.");
        }

        const data = await response.json();
        setRecipes((data ?? []).map(normalizeRecipe));
    }

    useEffect(() => {
        loadRecipes().catch(console.error);
    }, []);

    /* -------------------------------------------------------------
       Filtering
    ------------------------------------------------------------- */

    const filteredRecipes = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return recipes
            .filter((recipe) => {
                if (!selectedCategory) return true;

                return (recipe.categories ?? []).some(
                    (category) => getCategoryLabel(category) === selectedCategory
                );
            })
            .filter((recipe) => {
                if (!normalizedSearch) return true;

                const searchableText = [
                    recipe.title,
                    recipe.description,
                    getIngredientSearchText(recipe),
                    ...(recipe.categories ?? []).map(getCategoryLabel),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchableText.includes(normalizedSearch);
            });
    }, [recipes, search, selectedCategory]);

    /* -------------------------------------------------------------
       Grouping
    ------------------------------------------------------------- */

    const groupedRecipes = useMemo(() => {
        return groupRecipesByCategory(filteredRecipes);
    }, [filteredRecipes]);

    const categoryNames = useMemo(() => {
        return sortCategoryNames(Object.keys(groupedRecipes));
    }, [groupedRecipes]);

    useEffect(() => {
        setOpenGroups(createInitialOpenGroups(categoryNames, search));
    }, [categoryNames, search]);

    /* -------------------------------------------------------------
       Actions
    ------------------------------------------------------------- */

    function toggleGroup(categoryName) {
        setOpenGroups((prev) => ({
            ...prev,
            [categoryName]: !prev[categoryName],
        }));
    }

    async function deleteRecipe(id) {
        const confirmed = globalThis.confirm("Rezept wirklich löschen?");
        if (!confirmed) return;

        const response = await fetch(`${RECIPES_API}/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            console.error("Rezept konnte nicht gelöscht werden.");
            return;
        }

        await loadRecipes();
    }

    /* -------------------------------------------------------------
       Render
    ------------------------------------------------------------- */

    return (
        <div className="page">
            <h2>Rezepte</h2>

            {selectedCategory && (
                <p style={{ fontWeight: 600 }}>
                    Kategorie: {selectedCategory}
                    <button
                        type="button"
                        onClick={() => navigate("/recipes")}
                        style={{ marginLeft: "0.5rem" }}
                    >
                        ✕
                    </button>
                </p>
            )}

            <SearchBox value={search} onChange={setSearch} />

            {categoryNames.length === 0 && <p>Keine Rezepte gefunden.</p>}

            {categoryNames.map((categoryName) => (
                <RecipeGroup
                    key={categoryName}
                    category={categoryName}
                    recipes={groupedRecipes[categoryName]}
                    open={!!openGroups[categoryName]}
                    onToggle={toggleGroup}
                    onDelete={deleteRecipe}
                    badgeColors={badgeColors}
                />
            ))}
        </div>
    );
}
/* -------------------------------------------------------------
   Ende
------------------------------------------------------------- */
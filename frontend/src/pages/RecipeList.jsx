import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";

/* -------------------------------------------------------------
   Helper
------------------------------------------------------------- */

function getCategoryLabel(c) {
    return typeof c === "string" ? c : c?.name ?? "";
}

function getRecipeImageUrl(recipe) {
    const url = recipe?.imageUrl?.trim();
    if (url) {
        return url.startsWith("http") ? url : `http://localhost:8081${url}`;
    }

    const encoded = encodeURIComponent(recipe?.title || "Rezept");
    return `https://placehold.co/300x200?text=${encoded}`;
}

function normalizeRecipe(r) {
    return {
        ...r,
        title: r?.title ?? "",
        description: r?.description ?? "",
        ingredients: r?.ingredients ?? "",
        categories: r?.categories ?? [],
        imageUrl: r?.imageUrl ?? "",
    };
}

function groupRecipes(recipes) {
    return recipes.reduce((acc, r) => {
        const cats = r.categories ?? [];

        if (cats.length > 0) {
            cats.forEach((c) => {
                const name = getCategoryLabel(c) || "Ohne Kategorie";
                if (!acc[name]) acc[name] = [];
                acc[name].push(r);
            });
        } else {
            const key = "Ohne Kategorie";
            if (!acc[key]) acc[key] = [];
            acc[key].push(r);
        }

        return acc;
    }, {});
}

function initOpenGroups(categoryNames, search) {
    const open = {};
    categoryNames.forEach((c) => {
        // bei Suche alles aufklappen, sonst standardmäßig zu
        open[c] = search.trim().length > 0;
    });
    return open;
}

/* -------------------------------------------------------------
   UI Components
------------------------------------------------------------- */

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

    function handleClick(e) {
        e.preventDefault();
        e.stopPropagation();
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

function RecipeCard({ recipe, onDelete, badgeColors }) {
    return (
        <div
            style={{
                background: "white",
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
                }}
            >
                <img
                    src={getRecipeImageUrl(recipe)}
                    alt={recipe.title}
                    style={{ width: "100%", height: "100px", objectFit: "cover" }}
                    loading="lazy"
                />

                <h4 style={{ textAlign: "center", margin: "0.5rem 0" }}>
                    {recipe.title}
                </h4>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.3rem",
                        justifyContent: "center",
                        paddingBottom: "0.5rem",
                        paddingLeft: "0.5rem",
                        paddingRight: "0.5rem",
                    }}
                >
                    {(recipe.categories ?? []).map((c) => {
                        const label = getCategoryLabel(c);
                        return (
                            <CategoryBadge
                                key={`${recipe.id}-${label}`}
                                category={c}
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
                    color: "white",
                    border: "none",
                    padding: "0.35rem",
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

function RecipeGroup({ category, recipes, open, onToggle, onDelete, badgeColors }) {
    return (
        <div style={{ marginBottom: "1.5rem" }}>
            <button
                type="button"
                onClick={() => onToggle(category)}
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
                    {recipes.map((r) => (
                        <RecipeCard
                            key={r.id}
                            recipe={r}
                            onDelete={onDelete}
                            badgeColors={badgeColors}
                        />
                    ))}
                </div>
            )}
        </div>
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

/* -------------------------------------------------------------
   Main Component
------------------------------------------------------------- */

export default function RecipeList() {
    const [recipes, setRecipes] = useState([]);
    const [search, setSearch] = useState("");
    const [openGroups, setOpenGroups] = useState({});

    const location = useLocation();
    const navigate = useNavigate();

    const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const selectedCategory = params.get("category") || "";

    const badgeColors = useMemo(
        () => Object.fromEntries(CATEGORIES.map((c) => [c.name, c.color])),
        []
    );

    async function reload() {
        const res = await fetch("http://localhost:8081/api/recipes");
        const data = await res.json();
        setRecipes((data ?? []).map(normalizeRecipe));
    }

    useEffect(() => {
        reload().catch(console.error);
    }, []);

    const filteredRecipes = useMemo(() => {
        const t = search.trim().toLowerCase();

        return recipes
            .filter((r) =>
                selectedCategory
                    ? (r.categories ?? []).some((c) => getCategoryLabel(c) === selectedCategory)
                    : true
            )
            .filter((r) => {
                if (!t) return true;

                const haystack = [
                    r.title,
                    r.description,
                    r.ingredients,
                    ...(r.categories ?? []).map(getCategoryLabel),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return haystack.includes(t);
            });
    }, [recipes, search, selectedCategory]);

    const grouped = useMemo(() => groupRecipes(filteredRecipes), [filteredRecipes]);

    // sort group names, but keep "Ohne Kategorie" at end
    const categoryNames = useMemo(() => {
        const names = Object.keys(grouped);
        names.sort((a, b) => {
            if (a === "Ohne Kategorie") return 1;
            if (b === "Ohne Kategorie") return -1;
            return a.localeCompare(b);
        });
        return names;
    }, [grouped]);

    useEffect(() => {
        setOpenGroups(initOpenGroups(categoryNames, search));
    }, [categoryNames.join("|"), search]);

    function toggleGroup(cat) {
        setOpenGroups((p) => ({ ...p, [cat]: !p[cat] }));
    }

    async function deleteRecipe(id) {
        if (!globalThis.confirm("Rezept wirklich löschen?")) return;

        await fetch(`http://localhost:8081/api/recipes/${id}`, { method: "DELETE" });
        await reload();
    }

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

            {categoryNames.map((cat) => (
                <RecipeGroup
                    key={cat}
                    category={cat}
                    recipes={grouped[cat]}
                    open={!!openGroups[cat]}
                    onToggle={toggleGroup}
                    onDelete={deleteRecipe}
                    badgeColors={badgeColors}
                />
            ))}
        </div>
    );
}

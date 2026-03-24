import { useMemo } from "react";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";
import { createEmptyIngredientRow } from "../utils/recipeScanHelpers";

/* -------------------------------------------------------------
   Hilfsfunktionen
------------------------------------------------------------- */

function getCategoryLabel(category) {
    return typeof category === "string" ? category : category?.name ?? "";
}

/**
 * -------------------------------------------------------------
 * ScannedRecipeForm
 * -------------------------------------------------------------
 * Formular zum Prüfen und Anpassen eines erkannten Rezepts.
 * -------------------------------------------------------------
 */
export default function ScannedRecipeForm({
    recipe,
    setRecipe,
    onSave,
    onImageUpload,
    saving = false,
    error = "",
    saveLabel = "Speichern",
}) {
    const categoryOptions = useMemo(() => {
        return (CATEGORIES ?? [])
            .map((category) => getCategoryLabel(category).trim())
            .filter(Boolean);
    }, []);

    const selectedCategories = Array.isArray(recipe?.categories)
        ? recipe.categories
        : [];

    const ingredientRows = Array.isArray(recipe?.ingredientsRows)
        ? recipe.ingredientsRows
        : [createEmptyIngredientRow()];

    /* ---------------------------------------------------------
       Formular aktualisieren
    --------------------------------------------------------- */

    function updateField(field, value) {
        setRecipe((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function toggleCategory(categoryName) {
        setRecipe((prev) => {
            const currentCategories = Array.isArray(prev?.categories)
                ? prev.categories
                : [];

            const nextCategories = currentCategories.includes(categoryName)
                ? currentCategories.filter((item) => item !== categoryName)
                : [...currentCategories, categoryName];

            return {
                ...prev,
                categories: nextCategories,
            };
        });
    }

    function updateIngredientRow(index, field, value) {
        setRecipe((prev) => {
            const currentRows = Array.isArray(prev?.ingredientsRows)
                ? prev.ingredientsRows
                : [createEmptyIngredientRow()];

            const nextRows = [...currentRows];
            nextRows[index] = {
                ...nextRows[index],
                [field]: value,
            };

            return {
                ...prev,
                ingredientsRows: nextRows,
            };
        });
    }

    function addIngredientRow() {
        setRecipe((prev) => {
            const currentRows = Array.isArray(prev?.ingredientsRows)
                ? prev.ingredientsRows
                : [];

            return {
                ...prev,
                ingredientsRows: [...currentRows, createEmptyIngredientRow()],
            };
        });
    }

    function removeIngredientRow(index) {
        setRecipe((prev) => {
            const currentRows = Array.isArray(prev?.ingredientsRows)
                ? prev.ingredientsRows
                : [];

            const nextRows = currentRows.filter((_, rowIndex) => rowIndex !== index);

            return {
                ...prev,
                ingredientsRows:
                    nextRows.length > 0 ? nextRows : [createEmptyIngredientRow()],
            };
        });
    }

    /* ---------------------------------------------------------
       Render
    --------------------------------------------------------- */

    return (
        <div style={{ marginTop: 32 }}>
            <h2>Rezept prüfen</h2>

            {error ? (
                <div
                    role="alert"
                    style={{
                        marginBottom: 16,
                        padding: 10,
                        borderRadius: 8,
                        background: "#ffe5e5",
                        border: "1px solid #ffb3b3",
                    }}
                >
                    {error}
                </div>
            ) : null}

            <div
                style={{
                    display: "grid",
                    gap: 20,
                }}
            >
                <section>
                    <label
                        htmlFor="scan-title"
                        style={{ display: "grid", gap: 6 }}
                    >
                        <span>Titel</span>
                        <input
                            id="scan-title"
                            type="text"
                            value={recipe?.title ?? ""}
                            onChange={(event) => updateField("title", event.target.value)}
                            disabled={saving}
                        />
                    </label>
                </section>

                {onImageUpload ? (
                    <section>
                        <label style={{ display: "grid", gap: 6 }}>
                            <span>Rezeptbild</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onImageUpload}
                                disabled={saving}
                            />
                        </label>
                    </section>
                ) : null}

                <section>
                    <span style={{ display: "block", marginBottom: 8 }}>
                        Kategorien
                    </span>

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 10,
                        }}
                    >
                        {categoryOptions.map((categoryName) => {
                            const selected = selectedCategories.includes(categoryName);

                            return (
                                <label
                                    key={categoryName}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "6px 10px",
                                        borderRadius: 999,
                                        border: "1px solid #ddd",
                                        background: selected ? "#f3f3f3" : "#fff",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() => toggleCategory(categoryName)}
                                        disabled={saving}
                                    />
                                    <span>{categoryName}</span>
                                </label>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <label
                        htmlFor="scan-description"
                        style={{ display: "grid", gap: 6 }}
                    >
                        <span>Beschreibung</span>
                        <textarea
                            id="scan-description"
                            value={recipe?.description ?? ""}
                            onChange={(event) =>
                                updateField("description", event.target.value)
                            }
                            rows={4}
                            disabled={saving}
                        />
                    </label>
                </section>

                <section>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <h3 style={{ margin: 0 }}>Zutaten</h3>

                        <button
                            type="button"
                            onClick={addIngredientRow}
                            disabled={saving}
                        >
                            + Zutat hinzufügen
                        </button>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gap: 10,
                        }}
                    >
                        {ingredientRows.map((row, index) => (
                            <div
                                key={`${row?.name ?? "ingredient"}-${index}`}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "120px 1fr auto",
                                    gap: 10,
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="text"
                                    value={row?.amount ?? ""}
                                    onChange={(event) =>
                                        updateIngredientRow(index, "amount", event.target.value)
                                    }
                                    placeholder="Menge"
                                    disabled={saving}
                                />

                                <input
                                    type="text"
                                    value={row?.name ?? ""}
                                    onChange={(event) =>
                                        updateIngredientRow(index, "name", event.target.value)
                                    }
                                    placeholder="Zutat"
                                    disabled={saving}
                                />

                                <button
                                    type="button"
                                    onClick={() => removeIngredientRow(index)}
                                    disabled={saving}
                                    aria-label={`Zutat ${index + 1} entfernen`}
                                >
                                    Entfernen
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <div style={{ marginTop: 8 }}>
                    <button type="button" onClick={onSave} disabled={saving}>
                        {saving ? "Speichert..." : saveLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

ScannedRecipeForm.propTypes = {
    recipe: PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string,
        ingredientsRows: PropTypes.arrayOf(
            PropTypes.shape({
                amount: PropTypes.string,
                name: PropTypes.string,
            })
        ),
        categories: PropTypes.arrayOf(PropTypes.string),
        imageUrl: PropTypes.string,
    }).isRequired,
    setRecipe: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onImageUpload: PropTypes.func,
    saving: PropTypes.bool,
    error: PropTypes.string,
    saveLabel: PropTypes.string,
};
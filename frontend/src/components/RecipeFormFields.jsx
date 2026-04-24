import { useMemo } from "react";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";
import ImageUploadField from "./ImageUploadField";

/* -------------------------------------------------------------
   Helper
------------------------------------------------------------- */

function getCategoryLabel(category) {
    return typeof category === "string" ? category : category?.name ?? "";
}

function toInputValue(value) {
    return value == null ? "" : String(value);
}

/**
 * -------------------------------------------------------------
 * RecipeFormFields
 * -------------------------------------------------------------
 * Gemeinsame Formularfelder für Rezepte.
 * Spezialbereiche wie Zutaten werden von außen eingebunden.
 * -------------------------------------------------------------
 */
export default function RecipeFormFields({
    form,
    setForm,
    imageFile = null,
    imagePreviewUrl = "",
    onImageChange,
    disabled = false,
    categoryOptions,
    ingredientsSection = null,
    showMetaFields = true,
    showImageUpload = true,
}) {
    const resolvedCategoryOptions = useMemo(() => {
        const source = Array.isArray(categoryOptions)
            ? categoryOptions
            : CATEGORIES;

        return (source ?? [])
            .map((cat) => ({
                name: getCategoryLabel(cat).trim(),
                color: typeof cat === "object" ? cat?.color : undefined,
            }))
            .filter((cat) => cat.name);
    }, [categoryOptions]);

    function updateField(field, value) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function toggleCategory(name) {
        const currentCategories = Array.isArray(form?.categories)
            ? form.categories
            : [];

        const nextCategories = currentCategories.includes(name)
            ? currentCategories.filter((category) => category !== name)
            : [...currentCategories, name];

        updateField("categories", nextCategories);
    }

    /* ---------------------------------------------------------
  Render
--------------------------------------------------------- */
    return (
        <div className="recipe-main">
            {/* Basisdaten */}
            <section className="form-section">
                <h3>Basisdaten</h3>

                <label className="form-label">
                    <span>Titel</span>
                    <input
                        type="text"
                        value={toInputValue(form?.title)}
                        onChange={(event) => updateField("title", event.target.value)}
                        placeholder="z. B. Spaghetti Bolognese"
                        disabled={disabled}
                        required
                    />
                </label>

                <label className="form-label"
                    htmlFor="recipe-description">
                    <span>Beschreibung</span>
                    <textarea
                        value={toInputValue(form?.description)}
                        onChange={(event) =>
                            updateField("description", event.target.value)
                        }
                        rows={15}
                        disabled={disabled}
                    />
                </label>
            </section>

            {/* Kategorien */}
            <section className="form-section">
                <h3>Kategorien</h3>

                <div className="category-grid">
                    {resolvedCategoryOptions.map((category) => {
                        const selected =
                            Array.isArray(form?.categories) &&
                            form.categories.includes(category.name);

                        return (
                            <label
                                key={category.name}
                                className={`category-chip ${selected ? "selected" : ""}`}
                                style={
                                    category.color
                                        ? {
                                            borderColor: category.color,
                                            backgroundColor: selected
                                                ? `${category.color}22`
                                                : undefined,
                                        }
                                        : undefined
                                }
                            >
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleCategory(category.name)}
                                    disabled={disabled}
                                />
                                <span>{category.name}</span>
                            </label>
                        );
                    })}
                </div>
            </section>

            {/* Rezeptdetails */}
            {showMetaFields && (
                <section className="form-section">
                    <h3>Rezeptdetails</h3>

                    {/* Schwierigkeitsgrad */}
                    <div className="form-grid">
                        <label className="form-label">
                            <span>Schwierigkeitsgrad</span>
                            <select
                                value={toInputValue(form?.difficultyLevel)}
                                onChange={(event) =>
                                    updateField("difficultyLevel", event.target.value)
                                }
                                disabled={disabled}
                            >
                                <option value="">Bitte wählen</option>
                                <option value="EASY">Einfach</option>
                                <option value="MEDIUM">Mittel</option>
                                <option value="HARD">Schwierig</option>
                            </select>
                        </label>

                        {/* Zubereitungszeit */}
                        <label className="form-label">
                            <span>Zubereitungszeit (Min.)</span>
                            <input
                                type="number"
                                min="0"
                                value={toInputValue(form?.prepTimeMinutes)}
                                onChange={(event) =>
                                    updateField("prepTimeMinutes", event.target.value)
                                }
                                disabled={disabled}
                            />
                        </label>

                        {/* Kochzeit */}
                        <label className="form-label">
                            <span>Kochzeit (Min.)</span>
                            <input
                                type="number"
                                min="0"
                                value={toInputValue(form?.cookTimeMinutes)}
                                onChange={(event) =>
                                    updateField("cookTimeMinutes", event.target.value)
                                }
                                disabled={disabled}
                            />
                        </label>

                        {/* Portionen */}
                        <label className="form-label">
                            <span>Portionen</span>
                            <input
                                type="number"
                                min="1"
                                value={toInputValue(form?.servings)}
                                onChange={(event) =>
                                    updateField("servings", event.target.value)
                                }
                                disabled={disabled}
                            />
                        </label>

                        {/* Kalorien */}
                        <label className="form-label">
                            <span>Kalorien</span>
                            <input
                                type="number"
                                min="0"
                                value={toInputValue(form?.calories)}
                                onChange={(event) =>
                                    updateField("calories", event.target.value)
                                }
                                disabled={disabled}
                            />
                        </label>

                        {/* Protein */}
                        <label className="form-label">
                            <span>Protein</span>
                            <input
                                type="number"
                                min="0"
                                value={toInputValue(form?.protein)}
                                onChange={(event) =>
                                    updateField("protein", event.target.value)
                                }
                                disabled={disabled}
                            />
                        </label>

                        {/* Kohlenhydrate (g) */}
                        <label className="form-label">
                            <span>Kohlenhydrate (g)</span>
                            <input
                                type="number"
                                min="0"
                                value={toInputValue(form?.carbohydrates)}
                                onChange={(event) =>
                                    updateField("carbohydrates", event.target.value)
                                }
                                disabled={disabled}
                            />
                        </label>

                        {/* Fett (g) */}
                        <label className="form-label">
                            <span>Fett (g)</span>
                            <input
                                type="number"
                                min="0"
                                value={toInputValue(form?.fats)}
                                onChange={(event) =>
                                    updateField("fats", event.target.value)
                                }
                                disabled={disabled}
                            />
                        </label>

                        {/* Bewertung */}
                        <label className="form-label">
                            <span>Bewertung</span>
                            <input
                                type="number"
                                min="0"
                                value={toInputValue(form?.rating)}
                                onChange={(event) =>
                                    updateField("rating", event.target.value)
                                }
                                disabled={disabled}
                            />
                        </label>
                    </div>
                </section>
            )}

            {/* Spezialbereich: Zutaten */}
            {ingredientsSection}

            {/* Zubereitung */}
            <section className="form-section">
                <h3>Zubereitung</h3>

                <label className="form-label">
                    <span>Anleitung</span>
                    <textarea
                        value={toInputValue(form?.instructions)}
                        onChange={(event) =>
                            updateField("instructions", event.target.value)
                        }
                        placeholder="Zubereitungsschritte eingeben"
                        rows={8}
                        disabled={disabled}
                    />
                </label>
            </section>

            {/* Bild */}
            {showImageUpload && (
                <section className="form-section">
                    <h3>Bild</h3>

                    <ImageUploadField
                        imageFile={imageFile}
                        previewUrl={imagePreviewUrl}
                        title={form?.title ?? ""}
                        onChange={onImageChange}
                        disabled={disabled}
                    />
                </section>
            )}
        </div>
    );
}

/* -------------------------------------------------------------
   PropTypes
------------------------------------------------------------- */

RecipeFormFields.propTypes = {
    form: PropTypes.object.isRequired,
    setForm: PropTypes.func.isRequired,
    imageFile: PropTypes.object,
    imagePreviewUrl: PropTypes.string,
    onImageChange: PropTypes.func,
    disabled: PropTypes.bool,
    categoryOptions: PropTypes.array,
    ingredientsSection: PropTypes.node,
    showMetaFields: PropTypes.bool,
    showImageUpload: PropTypes.bool,
};

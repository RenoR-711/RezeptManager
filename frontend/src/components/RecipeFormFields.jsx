import { useMemo } from "react";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";

import IngredientEditor from "./IngredientEditor";
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
    showMetaFields = true,
    showImageUpload = true,
    showIngredients = true,
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
        const current = Array.isArray(form?.categories)
            ? form.categories
            : [];

        const next = current.includes(name)
            ? current.filter((c) => c !== name)
            : [...current, name];

        updateField("categories", next);
    }

    return (
        <div className="recipe-form-fields">
            {/* Basis */}
            <section className="form-section">
                <h2>Basisdaten</h2>

                <label className="form-label">
                    <span>Titel</span>
                    <input
                        type="text"
                        value={toInputValue(form?.title)}
                        onChange={(e) =>
                            updateField("title", e.target.value)
                        }
                        placeholder="z. B. Spaghetti Bolognese"
                        disabled={disabled}
                        required
                    />
                </label>

                <label className="form-label">
                    <span>Beschreibung</span>
                    <textarea
                        value={toInputValue(form?.description)}
                        onChange={(e) =>
                            updateField("description", e.target.value)
                        }
                        rows={3}
                        disabled={disabled}
                    />
                </label>
            </section>

            {/* Kategorien */}
            <section className="form-section">
                <h2>Kategorien</h2>

                <div className="category-grid">
                    {resolvedCategoryOptions.map((cat) => {
                        const selected =
                            Array.isArray(form?.categories) &&
                            form.categories.includes(cat.name);

                        return (
                            <label
                                key={cat.name}
                                className={`category-chip ${selected ? "selected" : ""
                                    }`}
                                style={
                                    cat.color
                                        ? {
                                            borderColor: cat.color,
                                            backgroundColor: selected
                                                ? `${cat.color}22`
                                                : undefined,
                                        }
                                        : undefined
                                }
                            >
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() =>
                                        toggleCategory(cat.name)
                                    }
                                    disabled={disabled}
                                />
                                <span>{cat.name}</span>
                            </label>
                        );
                    })}
                </div>
            </section>

            {/* Meta */}
            {showMetaFields && (
                <section className="form-section">
                    <h2>Rezeptdetails</h2>

                    <div className="form-grid two-columns">
                        <label className="form-label">
                            <span>Schwierigkeitsgrad</span>
                            <select
                                value={toInputValue(
                                    form?.difficultyLevel
                                )}
                                onChange={(e) =>
                                    updateField(
                                        "difficultyLevel",
                                        e.target.value
                                    )
                                }
                                disabled={disabled}
                            >
                                <option value="">Bitte wählen</option>
                                <option value="EASY">Einfach</option>
                                <option value="MEDIUM">Mittel</option>
                                <option value="HARD">Schwierig</option>
                            </select>
                        </label>

                        <label className="form-label">
                            <span>Portionen</span>
                            <input
                                type="number"
                                min="1"
                                value={toInputValue(form?.servings)}
                                onChange={(e) =>
                                    updateField(
                                        "servings",
                                        e.target.value
                                    )
                                }
                                disabled={disabled}
                            />
                        </label>

                        <label className="form-label">
                            <span>Vorbereitungszeit</span>
                            <input
                                type="number"
                                min="0"
                                value={toInputValue(
                                    form?.prepTimeMinutes
                                )}
                                onChange={(e) =>
                                    updateField(
                                        "prepTimeMinutes",
                                        e.target.value
                                    )
                                }
                                disabled={disabled}
                            />
                        </label>

                        <label className="form-label">
                            <span>Kochzeit</span>
                            <input
                                type="number"
                                min="0"
                                value={toInputValue(
                                    form?.cookTimeMinutes
                                )}
                                onChange={(e) =>
                                    updateField(
                                        "cookTimeMinutes",
                                        e.target.value
                                    )
                                }
                                disabled={disabled}
                            />
                        </label>
                    </div>
                </section>
            )}

            {/* Zutaten */}
            {showIngredients && (
                <section className="form-section">
                    <h2>Zutaten</h2>

                    <IngredientEditor
                        ingredients={form?.ingredients ?? ""}
                        onChange={(value) =>
                            updateField("ingredients", value)
                        }
                        disabled={disabled}
                    />
                </section>
            )}

            {/* Anleitung */}
            <section className="form-section">
                <h2>Zubereitung</h2>

                <label className="form-label">
                    <span>Anleitung</span>
                    <textarea
                        value={toInputValue(form?.instructions)}
                        onChange={(event) => updateField("instructions", event.target.value)}
                        placeholder="Zubereitungsschritte eingeben"
                        rows={8}
                        disabled={disabled}
                    />
                </label>
            </section>

            {/* Bild */}
            {showImageUpload && (
                <section className="form-section">
                    <h2>Bild</h2>

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
    showMetaFields: PropTypes.bool,
    showImageUpload: PropTypes.bool,
    showIngredients: PropTypes.bool,
};
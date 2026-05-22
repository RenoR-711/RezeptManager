import PropTypes from "prop-types";
import RecipeFormFields from "./RecipeFormFields";
import IngredientEditor from "./IngredientEditor";

/**
 * -------------------------------------------------------------
 * RecipeForm
 * -------------------------------------------------------------
 * Formular für den normalen Create-/Edit-Flow.
 *
 * Diese Komponente nutzt RecipeFormFields als gemeinsame Basis
 * Rendert die gemeinsamen Formularfelder, den Zutatenbereich
 * sowie Fehler- und Aktionsbereich.
 * -------------------------------------------------------------
 */

export default function RecipeForm({
    form,
    setForm,
    onSubmit,
    submitLabel = "Speichern",
    saving = false,
    error = "",
    onCancel,
    cancelLabel = "Abbrechen",
    imageFile = null,
    onImageChange,
    imagePreviewUrl = "",
    disabled = false,
    categoryOptions,
}) {

    const isDisabled = disabled || saving;

    function updateIngredients(value) {
        setForm((prev) => ({
            ...prev,
            ingredients: value,
        }));
    }

    /* ---------------------------------------------------------
   Render
--------------------------------------------------------- */
    return (
        <form className="edit-form" onSubmit={onSubmit}>
            <RecipeFormFields
                form={form}
                setForm={setForm}
                imageFile={imageFile}
                imagePreviewUrl={imagePreviewUrl}
                onImageChange={onImageChange}
                disabled={disabled || saving}
                categoryOptions={categoryOptions}
                ingredientsSection={
                        <IngredientEditor
                            ingredients={form?.ingredients ?? ""}
                            onChange={updateIngredients}
                            disabled={isDisabled}
                        />
                }
                showMetaFields={true}
                showImageUpload={true}
            />

            {error ? <p role="alert" className="form-error">{error}</p> : null}

            <div className="form-actions">
                {onCancel && (
                    <button
                        className="cancel"
                        type="button"
                        onClick={onCancel}
                        disabled={disabled || saving}
                    >
                        {cancelLabel}
                    </button>
                )}

                <button
                    className="save"
                    type="submit" disabled={disabled || saving}>
                    {saving ? "Speichern..." : submitLabel}
                </button>
            </div>
        </form>
    );
}

/* -------------------------------------------------------------
   PropTypes
------------------------------------------------------------- */

RecipeForm.propTypes = {
    form: PropTypes.shape({
        title: PropTypes.string,
        ingredients: PropTypes.string,
        description: PropTypes.string,
        categories: PropTypes.arrayOf(PropTypes.string),
        difficultyLevel: PropTypes.string,
        prepTimeMinutes: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        cookTimeMinutes: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        servings: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        calories: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        protein: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        carbohydrates: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        fats: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        rating: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        instructions: PropTypes.string,
        imageUrl: PropTypes.string,
    }).isRequired,
    setForm: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    submitLabel: PropTypes.string,
    saving: PropTypes.bool,
    error: PropTypes.string,
    onCancel: PropTypes.func,
    cancelLabel: PropTypes.string,
    imageFile: PropTypes.shape({
        name: PropTypes.string,
    }),
    onImageChange: PropTypes.func,
    imagePreviewUrl: PropTypes.string,
    disabled: PropTypes.bool,
    categoryOptions: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                name: PropTypes.string,
                color: PropTypes.string,
            }),
        ])
    ),
};
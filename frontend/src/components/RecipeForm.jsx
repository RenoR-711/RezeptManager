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
    showMetaFields = true,
    showImageUpload = true,
}) {
    const ingredientsSection = (
        <IngredientEditor
            value={form?.ingredients ?? ""}
            onChange={(value) =>
                setForm((prev) => ({
                    ...prev,
                    ingredients: value,
                }))
            }
            disabled={disabled}
        />
    );

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
                ingredientsSection={ingredientsSection}
                showMetaFields={showMetaFields}
                showImageUpload={showImageUpload}
            />

            {error ? <p className="form-error">{error}</p> : null}

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
    form: PropTypes.object.isRequired,
    setForm: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    submitLabel: PropTypes.string,
    saving: PropTypes.bool,
    error: PropTypes.string,
    onCancel: PropTypes.func,
    cancelLabel: PropTypes.string,
    imageFile: PropTypes.object,
    onImageChange: PropTypes.func,
    imagePreviewUrl: PropTypes.string,
    disabled: PropTypes.bool,
    categoryOptions: PropTypes.array,
    showMetaFields: PropTypes.bool,
    showImageUpload: PropTypes.bool,
};

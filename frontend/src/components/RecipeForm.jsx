import PropTypes from "prop-types";
import RecipeFormFields from "./RecipeFormFields";

/**
 * -------------------------------------------------------------
 * RecipeForm
 * -------------------------------------------------------------
 * Formular für den normalen Create-/Edit-Flow.
 *
 * Diese Komponente nutzt RecipeFormFields als gemeinsame Basis
 * und ergänzt den Zutatenbereich als Textarea.
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
    /* ---------------------------------------------------------
       Zutatenfeld
    --------------------------------------------------------- */

    const ingredientsSection = (
        <label className="form-label">
            <span>Zutaten</span>

            <textarea
                value={form.ingredients ?? ""}
                onChange={(event) =>
                    setForm((prev) => ({
                        ...prev,
                        ingredients: event.target.value,
                    }))
                }
                placeholder={`z. B.\n- 200 g Nudeln\n- 1 Dose Tomaten\n- Chili\n...`}
                rows={6}
                disabled={disabled || saving}
            />
        </label>
    );

    /* ---------------------------------------------------------
       Render
    --------------------------------------------------------- */

    return (
        <form onSubmit={onSubmit}>
            <RecipeFormFields
                form={form}
                setForm={setForm}
                imageFile={imageFile}
                onImageChange={onImageChange}
                imagePreviewUrl={imagePreviewUrl}
                disabled={disabled || saving}
                categoryOptions={categoryOptions}
                ingredientsSection={ingredientsSection}
                showMetaFields={true}
                showImageUpload={true}
            />

            {error ? (
                <div
                    role="alert"
                    style={{
                        marginTop: 16,
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
                className="form-actions"
                style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 16,
                    flexWrap: "wrap",
                }}
            >
                <button type="submit" disabled={disabled || saving}>
                    {saving ? "Speichert..." : submitLabel}
                </button>

                {onCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={disabled || saving}
                    >
                        {cancelLabel}
                    </button>
                ) : null}
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
        ]),
    ),
};
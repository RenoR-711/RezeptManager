import PropTypes from "prop-types";

/**
 * -------------------------------------------------------------
 * IngredientEditor
 * -------------------------------------------------------------
 * Einfaches Eingabefeld für Zutaten als Text.
 * -------------------------------------------------------------
 */
export default function IngredientEditor({
  ingredients = "",
  onChange,
  disabled = false,
}) {
  function handleChange(event) {
    onChange(event.target.value);
  }

  return (
    <label className="form-label">
      <span>Zutaten</span>

      <textarea
        value={ingredients ?? ""}
        onChange={handleChange}
        placeholder={`z. B.\n- 200 g Nudeln\n- 1 Dose Tomaten\n- Chili\n...`}
        rows={6}
        disabled={disabled}
      />
    </label>
  );
}

IngredientEditor.propTypes = {
  ingredients: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
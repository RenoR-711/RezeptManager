import PropTypes from "prop-types";

/**
 * -------------------------------------------------------------
 * IngredientEditor
 * -------------------------------------------------------------
 * Einfaches Eingabefeld für Zutaten als Text.
 * Verwaltet Zutaten als Array von Objekten:
 * { amount, unit, name }
 * -------------------------------------------------------------
 */
export default function IngredientEditor({
  value = "",
  onChange,
  disabled = false,
}) {
  return (
    <section className="form-section">
      <h3>Zutaten</h3>

      <label className="form-label" htmlFor="ingredients">
        {/* <span>Zutaten</span> */}
        <textarea
          id="ingredients"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={`z. B.
- 200 g Mehl
- 2 Eier
- 250 ml Milch`}
          rows={8}
          disabled={disabled}
        />
      </label>
    </section>
  );
}

IngredientEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
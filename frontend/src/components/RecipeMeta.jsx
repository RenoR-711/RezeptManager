import PropTypes from "prop-types";
/**
 * -------------------------------------------------------------
 * <RecipeMeta></RecipeMeta>
 * -------------------------------------------------------------
 * Zeigt metadaten für ein Rezept an.
 *
 * @param {string} label - Der Anzeigename der Metadaten
 * @param {string} value - Der Wert der Metadaten
 */

export default function RecipeMeta({ label, value }) {
    const displayValue =
        value === null || value === undefined || value === ""
            ? "—"
            : String(value);

    return (
        <div className="recipe-meta-card">
            <div className="recipe-meta-label">
                {label}
            </div>

            <div className="recipe-meta-value">
                {displayValue}
            </div>
        </div>
    );
}

RecipeMeta.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
};
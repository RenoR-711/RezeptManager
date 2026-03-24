import PropTypes from "prop-types";

/* -------------------------------------------------------------
   Hilfsfunktion
------------------------------------------------------------- */

/**
 * Wandelt unterschiedliche Zutatenformate in lesbare Strings um.
 */
function normalizeIngredients(ingredients = []) {
    if (!Array.isArray(ingredients)) return [];

    const asStrings = ingredients
        .map((item) => {
            // Fall: bereits String
            if (typeof item === "string") {
                return item.trim();
            }

            // Fall: Objekt
            if (item && typeof item === "object") {
                const amount = item.amount ?? "";
                const amountWord = item.amountWord ?? "";
                const name = item.name ?? "";

                return [amount, amountWord, name]
                    .map((part) => String(part).trim())
                    .filter(Boolean)
                    .join(" ");
            }

            return "";
        })
        .filter(Boolean);

    // Duplikate entfernen + sortieren
    return [...new Set(asStrings)].sort((a, b) =>
        a.localeCompare(b, "de")
    );
}

/**
 * -------------------------------------------------------------
 * IngredientList
 * -------------------------------------------------------------
 * Zeigt eine Zutatenliste an.
 * Unterstützt Strings und Objekt-Formate.
 * -------------------------------------------------------------
 */
export default function IngredientList({
    ingredients,
    title = "Zutaten",
}) {
    const normalizedIngredients = normalizeIngredients(ingredients);

    if (normalizedIngredients.length === 0) {
        return (
            <section>
                <h2>{title}</h2>
                <p>Keine Zutaten vorhanden.</p>
            </section>
        );
    }

    return (
        <section>
            <h2>{title}</h2>

            <ul
                style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "16px 0 0",
                    display: "grid",
                    gap: 10,
                }}
            >
                {normalizedIngredients.map((ingredient) => (
                    <li
                        key={ingredient}
                        style={{
                            padding: "12px 14px",
                            borderRadius: 12,
                            background: "#f6f6f6",
                            border: "1px solid #e7e7e7",
                            fontSize: 15,
                        }}
                    >
                        {ingredient}
                    </li>
                ))}
            </ul>
        </section>
    );
}

/* -------------------------------------------------------------
   PropTypes
------------------------------------------------------------- */

IngredientList.propTypes = {
    ingredients: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                amount: PropTypes.oneOfType([
                    PropTypes.string,
                    PropTypes.number,
                ]),
                amountWord: PropTypes.string,
                name: PropTypes.string,
            }),
        ])
    ),
    title: PropTypes.string,
};
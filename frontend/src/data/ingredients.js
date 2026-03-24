/* =========================================================
   INGREDIENT UTILITIES
   ---------------------------------------------------------
   Zentrale Konfiguration und Hilfsfunktionen für Zutaten
   im RezeptManager.
========================================================= */

/**
 * Wörter die eine Menge beschreiben können,
 * obwohl sie keine Zahl enthalten.
 * Beispiel: "Prise Salz", "Schuss Öl"
 */
export const AMOUNT_WORDS = new Set([
  "prise",
  "schuss",
  "messerspitze",
  "stück",
  "etwas",
  "handvoll",
]);

/**
 * Liste häufiger Zutaten
 * Kann z.B. genutzt werden für:
 * - Autocomplete
 * - Vorschläge beim Rezeptscan
 * - Filter / Zutatenübersicht
 */
export const INGREDIENTS = [
  "Mehl",
  "Zucker",
  "Eier",
  "Milch",
  "Butter",
  "Tomaten",
  "Käse",
  "Nudeln",
  "Salz",
  "Pfeffer",
];

/**
 * Erstellt eine neue Zutatenzeile
 * Wird z.B. im Rezeptscanner genutzt.
 */
export function newIngredientRow() {
  return {
    id: crypto.randomUUID(),
    amount: "",
    name: "",
  };
}

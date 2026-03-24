/* -------------------------------------------------------------
   ingredientHelpers.js
------------------------------------------------------------- */

/**
 * Liest den Namen einer Zutat aus.
 * Unterstützt Strings und Objektformate.
 */
function getIngredientName(ingredient) {
  if (typeof ingredient === "string") {
    return ingredient.trim();
  }

  if (ingredient && typeof ingredient === "object") {
    return ingredient.name?.trim() ?? "";
  }

  return "";
}

/**
 * Gibt das Zutaten-Array eines Rezepts zurück.
 */
function getRecipeIngredients(recipe) {
  return Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
}

/**
 * Ermittelt eine eindeutige, alphabetisch sortierte Zutatenliste
 * aus mehreren Rezepten.
 */
export function extractUniqueIngredients(recipes = []) {
  const names = recipes
    .flatMap(getRecipeIngredients)
    .map(getIngredientName)
    .filter(Boolean);

  return [...new Set(names)].sort((a, b) =>
    a.localeCompare(b, "de", { sensitivity: "base" }),
  );
}

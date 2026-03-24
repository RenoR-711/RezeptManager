/* -------------------------------------------------------------
   recipeFormMapper.js
------------------------------------------------------------- */

/**
 * Hilfsfunktion für Form-Inputs:
 * null und undefined werden zu einem leeren String.
 */
function toInputString(value) {
  return value == null ? "" : String(value);
}

/**
 * Kategorien immer als String-Array zurückgeben.
 * Unterstützt Strings und Objekte mit name.
 */
function normalizeCategories(categories) {
  return (categories ?? [])
    .map((category) =>
      typeof category === "string" ? category : category?.name,
    )
    .map((name) => name?.trim())
    .filter(Boolean);
}

/**
 * Leere oder ungültige Werte werden zu null.
 * Sonst wird eine Zahl zurückgegeben.
 */
function toOptionalNumber(value) {
  if (value == null || String(value).trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Zutaten aus dem Backend für die Textarea vorbereiten.
 *
 * Unterstützt:
 * - String
 * - Array von Strings
 * - Array von Objekten wie { amount, amountWord, name }
 */
function normalizeIngredientsToText(ingredients) {
  if (typeof ingredients === "string") {
    return ingredients;
  }

  if (!Array.isArray(ingredients)) {
    return "";
  }

  return ingredients
    .map((ingredient) => {
      if (typeof ingredient === "string") {
        return ingredient.trim();
      }

      const amount = ingredient?.amount ?? "";
      const amountWord = ingredient?.amountWord ?? "";
      const name = ingredient?.name ?? "";

      return [amount, amountWord, name]
        .map((part) => String(part).trim())
        .filter(Boolean)
        .join(" ");
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Kategorien für das Backend ins Objektformat umwandeln.
 */
function mapCategoryNameToObject(name) {
  return { name };
}

/* -------------------------------------------------------------
   API -> Form
------------------------------------------------------------- */

export function mapRecipeToForm(recipe = {}) {
  return {
    title: toInputString(recipe.title),
    description: toInputString(recipe.description),
    ingredients: normalizeIngredientsToText(recipe.ingredients),
    instructions: toInputString(recipe.instructions),
    categories: normalizeCategories(recipe.categories),

    difficultyLevel: toInputString(recipe.difficultyLevel),

    prepTimeMinutes: toInputString(recipe.prepTimeMinutes),
    cookTimeMinutes: toInputString(recipe.cookTimeMinutes),
    servings: toInputString(recipe.servings),

    calories: toInputString(recipe.calories),
    protein: toInputString(recipe.protein),
    carbohydrates: toInputString(recipe.carbohydrates),
    fats: toInputString(recipe.fats),
    rating: toInputString(recipe.rating),

    imageUrl: toInputString(recipe.imageUrl),
    imageFile: null,
  };
}

/* -------------------------------------------------------------
   Standard-Formularzustand
------------------------------------------------------------- */

export const EMPTY_RECIPE_FORM = {
  title: "",
  description: "",
  ingredients: "",
  instructions: "",
  categories: [],
  difficultyLevel: "",
  prepTimeMinutes: "",
  cookTimeMinutes: "",
  servings: "",
  calories: "",
  protein: "",
  carbohydrates: "",
  fats: "",
  rating: "",
  imageUrl: "",
  imageFile: null,
};

/* -------------------------------------------------------------
   Form -> API
------------------------------------------------------------- */

export function buildPayloadFromForm(form, extra = {}) {
  const normalizedCategories = normalizeCategories(form.categories);

  return {
    ...extra,
    title: form.title?.trim() ?? "",
    description: form.description?.trim() ?? "",
    ingredients: form.ingredients?.trim() ?? "",
    instructions: form.instructions?.trim() ?? "",

    difficultyLevel: form.difficultyLevel?.trim() ?? "",

    prepTimeMinutes: toOptionalNumber(form.prepTimeMinutes),
    cookTimeMinutes: toOptionalNumber(form.cookTimeMinutes),
    servings: toOptionalNumber(form.servings),

    calories: toOptionalNumber(form.calories),
    protein: toOptionalNumber(form.protein),
    carbohydrates: toOptionalNumber(form.carbohydrates),
    fats: toOptionalNumber(form.fats),
    rating: toOptionalNumber(form.rating),

    imageUrl: form.imageUrl?.trim() ?? extra.imageUrl ?? "",

    categories: normalizedCategories.map(mapCategoryNameToObject),
  };
}

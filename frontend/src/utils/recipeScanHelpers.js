/* -------------------------------------------------------------
   recipeScanHelpers.js
------------------------------------------------------------- */

const EMPTY_INGREDIENT_ROW = Object.freeze({
  amount: "",
  name: "",
});

/* -------------------------------------------------------------
   Zutaten
------------------------------------------------------------- */

/**
 * Erstellt eine leere Zutatenzeile.
 */
export function createEmptyIngredientRow() {
  return { ...EMPTY_INGREDIENT_ROW };
}

/**
 * Prüft, ob eine Zutatenzeile Inhalt hat.
 */
export function hasIngredientContent(row) {
  return Boolean(row?.amount?.trim() || row?.name?.trim());
}

/**
 * Zerlegt eine Zutatenzeile in amount und name.
 *
 * Beispiele:
 * - "200 g Mehl" -> { amount: "200 g", name: "Mehl" }
 * - "2 Eier" -> { amount: "2", name: "Eier" }
 * - "Prise Salz" -> { amount: "Prise", name: "Salz" }
 * - "Salz" -> { amount: "", name: "Salz" }
 */
export function parseIngredientLine(line) {
  if (!line?.trim()) {
    return createEmptyIngredientRow();
  }

  const parts = line.trim().split(/\s+/);

  if (parts.length >= 3) {
    return {
      amount: parts.slice(0, 2).join(" "),
      name: parts.slice(2).join(" "),
    };
  }

  if (parts.length === 2) {
    return {
      amount: parts[0],
      name: parts[1],
    };
  }

  return {
    amount: "",
    name: line.trim(),
  };
}

/**
 * Baut aus einem mehrzeiligen Text Zutatenzeilen.
 */
export function buildIngredientRows(rawIngredients) {
  if (!rawIngredients?.trim()) {
    return [createEmptyIngredientRow()];
  }

  const rows = rawIngredients
    .split(/\r?\n/)
    .map((line) => parseIngredientLine(line))
    .filter(hasIngredientContent);

  return rows.length > 0 ? rows : [createEmptyIngredientRow()];
}

/**
 * Wandelt Zutatenzeilen zurück in Text um.
 */
export function serializeIngredients(rows) {
  return (rows ?? [])
    .filter(hasIngredientContent)
    .map((row) => [row.amount, row.name].filter(Boolean).join(" "))
    .join("\n");
}

/* -------------------------------------------------------------
   Scan -> Formular
------------------------------------------------------------- */

/**
 * Erstellt den Formularzustand aus dem Scan-Ergebnis.
 */
export function createRecipeFromScanResult(data) {
  return {
    title: data?.title ?? "",
    description: data?.description ?? "",
    ingredientsRows: buildIngredientRows(data?.ingredients),
    categories: [],
    imageUrl: data?.imageUrl ?? "",
  };
}

/* -------------------------------------------------------------
   Formular -> API
------------------------------------------------------------- */

/**
 * Baut das Payload für das Speichern.
 */
export function buildRecipePayload(recipe) {
  return {
    title: recipe?.title?.trim() ?? "",
    description: recipe?.description?.trim() ?? "",
    ingredients: serializeIngredients(recipe?.ingredientsRows),
    categories: (recipe?.categories ?? []).map((name) => ({ name })),
    imageUrl: recipe?.imageUrl?.trim() ?? "",
  };
}

/* -------------------------------------------------------------
   recipeScanMapper.js
------------------------------------------------------------- */

import { buildIngredientRows, serializeIngredients } from "./recipeScanHelpers";

/**
 * -------------------------------------------------------------
 * Scan → Formular
 * -------------------------------------------------------------
 * Wandelt ein ParsedRecipe aus dem Backend
 * in den lokalen Formularzustand um.
 */
export function mapScanResultToForm(data = {}) {
  return {
    title: data?.title ?? "",
    description: data?.description ?? "",
    instructions: data?.instructions ?? "",
    ingredientsRows: buildIngredientRows(data?.ingredients),
    categories: [],
    imageUrl: data?.imageUrl ?? "",
  };
}

/**
 * -------------------------------------------------------------
 * Formular → API
 * -------------------------------------------------------------
 * Baut ein sauberes Payload für das Speichern.
 */
export function buildPayloadFromScanForm(form = {}) {
  return {
    title: form?.title?.trim() ?? "",
    description: form?.description?.trim() ?? "",
    instructions: form?.instructions?.trim() || form?.description?.trim() || "",
    ingredients: serializeIngredients(form?.ingredientsRows),
    categories: form?.categories ?? [],
    imageUrl: form?.imageUrl?.trim() ?? "",
  };
}

export function mapRecipeToForm(recipe) {
    return {
        title: recipe?.title ?? "",
        description: recipe?.description ?? "",
        ingredients: recipe?.ingredients ?? "",
        categories: (recipe?.categories ?? [])
            .map((c) => (typeof c === "string" ? c : c?.name))
            .filter(Boolean),

        difficultyLevel: recipe?.difficultyLevel ?? "EASY",
        prepTimeMinutes: recipe?.prepTimeMinutes ?? "",
        cookTimeMinutes: recipe?.cookTimeMinutes ?? "",
        servings: recipe?.servings ?? "",
        calories: recipe?.calories ?? "",
        protein: recipe?.protein ?? "",
        carbohydrates: recipe?.carbohydrates ?? "",
        fats: recipe?.fats ?? "",
        rating: recipe?.rating ?? "",
    };
}

// sendet nur Zahlen, wenn wirklich gesetzt
function numOrUndef(v) {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

export function buildPayloadFromForm(form, { imageUrl } = {}) {
    const payload = {
        title: (form.title ?? "").trim(),
        description: (form.description ?? "").trim(),
        ingredients: (form.ingredients ?? "").trim(),
        categories: (form.categories ?? []).map((name) => ({ name })),
        difficultyLevel: form.difficultyLevel || "EASY",
        prepTimeMinutes: numOrUndef(form.prepTimeMinutes),
        cookTimeMinutes: numOrUndef(form.cookTimeMinutes),
        servings: numOrUndef(form.servings),
        calories: numOrUndef(form.calories),
        protein: numOrUndef(form.protein),
        carbohydrates: numOrUndef(form.carbohydrates),
        fats: numOrUndef(form.fats),
        rating: numOrUndef(form.rating),
    };

    const prepTimeMinutes = numOrUndef(form.prepTimeMinutes);
    if (prepTimeMinutes !== undefined) payload.prepTimeMinutes = prepTimeMinutes;

    const cookTimeMinutes = numOrUndef(form.cookTimeMinutes);
    if (cookTimeMinutes !== undefined) payload.cookTimeMinutes = cookTimeMinutes;

    const servings = numOrUndef(form.servings);
    if (servings !== undefined) payload.servings = servings;

    const calories = numOrUndef(form.calories);
    if (calories !== undefined) payload.calories = calories;

    const protein = numOrUndef(form.protein);
    if (protein !== undefined) payload.protein = protein;

    const carbohydrates = numOrUndef(form.carbohydrates);
    if (carbohydrates !== undefined) payload.carbohydrates = carbohydrates;

    const fats = numOrUndef(form.fats);
    if (fats !== undefined) payload.fats = fats;

    const rating = numOrUndef(form.rating);
    if (rating !== undefined) payload.rating = rating;

    if (imageUrl !== undefined) payload.imageUrl = imageUrl;

    return payload;
}
/* -------------------------------------------------------------
   Ende
------------------------------------------------------------- */
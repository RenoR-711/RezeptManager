const API_BASE = "http://localhost:8081";
const PLACEHOLDER_BASE = "https://placehold.co/800x500?text=";

/* -------------------------------------------------------------
   Helper Functions
------------------------------------------------------------- */

/**
 * Gibt den lesbaren Kategorienamen zurück.
 * Unterstützt sowohl Strings als auch Objekt-Formate.
 */
export function getCategoryLabel(category) {
    return typeof category === "string" ? category : (category?.name ?? "");
}

/**
 * Normalisiert Kategorien in ein sauberes String-Array.
 */
export function normalizeCategories(categories) {
    return (categories ?? [])
        .map((category) => getCategoryLabel(category))
        .filter(Boolean);
}

/**
 * Liefert die Bild-URL für ein Rezept.
 * - Absolute URL: direkt verwenden
 * - Relative URL: Backend-Host voranstellen
 * - Kein Bild: Placeholder verwenden
 */
export function getRecipeImageUrl(recipe) {
    const rawUrl = recipe?.imageUrl?.trim();

    if (rawUrl) {
        return rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`;
    }

    const encodedTitle = encodeURIComponent(recipe?.title || "Rezept");
    return `${PLACEHOLDER_BASE}${encodedTitle}`;
}

/**
 * Wandelt Zutaten-Text in eine Liste um.
 * Entfernt typische Aufzählungszeichen.
 */
export function parseIngredients(ingredients) {
    if (!ingredients) return [];

    if (Array.isArray(ingredients)) {
        return ingredients
            .map((item) => {
                if (!item) return "";

                if (typeof item === "string") return item.trim();

                const amount = item.amount ?? "";
                const amountWord =
                    item.amountWord ?? item.Amount_Word ?? item.unit ?? "";
                const ingredientName =
                    item.name ?? item.ingredientName ?? item.ingredient?.name ?? "";

                return [amount, amountWord, ingredientName]
                    .filter((value) => String(value ?? "").trim() !== "")
                    .join(" ")
                    .trim();
            })
            .filter(Boolean);
    }

    if (typeof ingredients === "string") {
        return ingredients
            .split("\n")
            .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
            .filter(Boolean);
    }

    return [];
}

/**
 * Baut eine Farbzuordnung für Kategorien auf.
 */
export function buildCategoryColorMap(categories) {
    const map = new Map();

    (categories || []).forEach((category) => {
        const name = getCategoryLabel(category);
        const color = typeof category === "object" ? category?.color : undefined;

        if (name) map.set(name, color);
    });

    return map;
}
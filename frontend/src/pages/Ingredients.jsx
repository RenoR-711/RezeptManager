import { useEffect, useMemo, useState } from "react";
import IngredientList from "../components/IngredientList";
import { INGREDIENTS } from "../data/ingredients";
import { extractUniqueIngredients } from "../utils/ingredientHelpers";

const API_BASE = "http://localhost:8081";

/* =========================================================
   HELPER
========================================================= */

/**
 * Führt statische Zutaten und dynamisch geladene Zutaten
 * zu einer eindeutigen, alphabetisch sortierten Liste zusammen.
 */
function mergeIngredients(staticIngredients = [], dynamicIngredients = []) {
  return [...new Set([...staticIngredients, ...dynamicIngredients])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "de"));
}

/* =========================================================
   PAGE: INGREDIENTS
   ---------------------------------------------------------
   Zeigt eine zentrale Zutatenübersicht an.
   Datenquellen:
   1. Statische Basisliste aus data/ingredients
   2. Dynamisch erkannte Zutaten aus vorhandenen Rezepten
========================================================= */

export default function Ingredients() {
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  /* =========================================================
     DATEN LADEN
  ========================================================= */
  useEffect(() => {
    async function loadRecipes() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/api/recipes`);

        if (!response.ok) {
          throw new Error("Rezepte konnten nicht geladen werden.");
        }

        const recipes = await response.json();
        const uniqueIngredients = extractUniqueIngredients(recipes);

        setRecipeIngredients(uniqueIngredients);
      } catch (err) {
        setError(err.message || "Unbekannter Fehler beim Laden der Zutaten.");
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, []);

  /* =========================================================
     ABGELEITETE DATEN
  ========================================================= */
  const allIngredients = useMemo(() => {
    return mergeIngredients(INGREDIENTS, recipeIngredients);
  }, [recipeIngredients]);

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="page">
      <h1>Zutaten</h1>
      <p>
        Übersicht aller bekannten Zutaten aus der Basisliste und aus bereits
        gespeicherten Rezepten.
      </p>

      {loading && <p>Zutaten werden geladen...</p>}

      {!loading && error && <p>{error}</p>}

      {!loading && !error && allIngredients.length === 0 && (
        <p>Es sind aktuell keine Zutaten vorhanden.</p>
      )}

      {!loading && !error && allIngredients.length > 0 && (
        <IngredientList ingredients={allIngredients} />
      )}
    </div>
  );
}
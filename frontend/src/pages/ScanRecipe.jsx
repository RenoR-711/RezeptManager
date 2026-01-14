import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------------
   Hilfsfunktionen (AUSSERHALB der Komponente)
------------------------------------------------------------- */

// Neue Zutatenzeile
function newIngredientRow() {
  return {
    id: crypto.randomUUID(),
    amount: "",
    name: "",
  };
}

// Zutaten parser
const mengenWoerter = new Set([
  "prise",
  "schuss",
  "messerspitze",
  "stück",
  "etwas",
  "handvoll",
]);

function convertIngredientsToRows(text) {
  if (!text || text.trim() === "") {
    return [newIngredientRow()];
  }

  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/);

      if (parts.length === 1) {
        return { ...newIngredientRow(), name: line };
      }

      const first = parts[0].toLowerCase();

      if (Number.isNaN(first)) {
        return {
          ...newIngredientRow(),
          amount: parts.slice(0, 2).join(" "),
          name: parts.slice(2).join(" "),
        };
      }

      if (mengenWoerter.has(first)) {
        return {
          ...newIngredientRow(),
          amount: parts[0],
          name: parts.slice(1).join(" "),
        };
      }

      return { ...newIngredientRow(), name: line };
    });
}

/* -------------------------------------------------------------
   React-Komponente
------------------------------------------------------------- */

export default function ScanRecipe() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const categories = [
    "Asiatisch",
    "Backen",
    "Brunch",
    "Chinesisch",
    "Cocktails",
    "Dessert",
    "Festlich",
    "Frühstück",
    "Gesund",
    "Getränke",
    "Glutenfrei",
    "Grillen",
    "Hauptgericht",
    "Indisch",
    "Italienisch",
    "Kinder",
    "Koreanisch",
    "LowCarb",
    "Mexikanisch",
    "Party",
    "Salate",
    "SchnellEinfach",
    "Smoothies",
    "Snacks",
    "Suppe",
    "Thailändisch",
    "Vegan",
    "Vegetarisch",
    "Vorspeise",
  ];

  const [recipe, setRecipe] = useState({
    title: "",
    description: "",
    ingredientsRows: [newIngredientRow()],
    categories: [],
  });

  // -------------------------------------------------------------
  // Datei auswählen
  // -------------------------------------------------------------
  function handleFileChange(e) {
    setFile(e.target.files[0]);
    setError(null);
  }

  // -------------------------------------------------------------
  // OCR analysieren
  // -------------------------------------------------------------
  async function handleScan() {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setError(null);

    try {
      const res = await fetch("http://localhost:8081/api/scan/image-preview", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Analyse fehlgeschlagen.");

      const data = await res.json();
      const rows = convertIngredientsToRows(data.ingredients);

      setRecipe((prev) => ({
        ...prev,
        title: data.title || "",
        description: data.description || "",
        ingredientsRows: rows,
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  // -------------------------------------------------------------
  // Formular-Updates
  // -------------------------------------------------------------
  function updateField(field, value) {
    setRecipe((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(cat) {
    setRecipe((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  }

  function updateIngredientRow(id, field, value) {
    setRecipe((prev) => ({
      ...prev,
      ingredientsRows: prev.ingredientsRows.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    }));
  }

  function addIngredientRow() {
    setRecipe((prev) => ({
      ...prev,
      ingredientsRows: [...prev.ingredientsRows, newIngredientRow()],
    }));
  }

  function removeIngredientRow(id) {
    setRecipe((prev) => ({
      ...prev,
      ingredientsRows: prev.ingredientsRows.filter((r) => r.id !== id),
    }));
  }

  // -------------------------------------------------------------
  // Speichern
  // -------------------------------------------------------------
  async function handleSave() {
    if (!recipe.title.trim()) {
      alert("Titel fehlt");
      return;
    }

    setSaving(true);

    const ingredients = recipe.ingredientsRows
      .filter((r) => r.amount.trim() || r.name.trim())
      .map((r) => `${r.amount} ${r.name}`.trim())
      .join("\n");

    const payload = {
      title: recipe.title.trim(),
      description: recipe.description.trim(),
      ingredients,
      categories: recipe.categories.map((name) => ({ name })),
    };

    try {
      const res = await fetch("http://localhost:8081/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Speichern fehlgeschlagen.");

      await res.json();
      navigate("/recipes");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  /* ---------------- handleImageUpload ---------------- */
    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("http://localhost:8081/api/uploads/image", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Upload fehlgeschlagen");
            }

            const imageUrl = await res.json();

            // imageUrl direkt im Recipe-State speichern
            setRecipe((prev) => ({
                ...prev,
                imageUrl,
            }));
        } catch (err) {
            console.error(err);
            alert("Bild-Upload fehlgeschlagen");
        }
    }

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Rezept per Foto einscannen</h2>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      <div style={{ marginTop: "1rem" }}>
        <button disabled={!file || saving} onClick={handleScan}>
          Foto analysieren
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: "2rem" }}>
        <label htmlFor="title"><h3>Titel</h3></label>
        <input
          id="title"
          type="text"
          value={recipe.title}
          onChange={(e) => updateField("title", e.target.value)}
          style={{ width: "100%", marginBottom: "1rem" }}
        />

        <div style={{ marginBottom: "1rem" }}>
          <label>
            <h3>Rezeptbild:</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "block", marginTop: "0.5rem" }}
            />
          </label>
        </div>

        <label htmlFor="categorie"><h3>Kategorien</h3></label>
        <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
          {categories.map((cat) => (
            <label key={cat} style={{ display: "flex", gap: "0.4rem" }}>
              <input
                type="checkbox"
                checked={recipe.categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              {cat}
            </label>
          ))}
        </div>

        <label htmlFor="description"><h3>Beschreibung</h3></label>
        <textarea
          id="description"
          value={recipe.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={5}
          style={{ width: "100%", marginBottom: "1rem" }}
        />

        <h4>Zutaten</h4>
        <table style={{ width: "100%", marginBottom: "1rem" }}>
          <tbody>
            {recipe.ingredientsRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    value={row.amount}
                    onChange={(e) =>
                      updateIngredientRow(row.id, "amount", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) =>
                      updateIngredientRow(row.id, "name", e.target.value)
                    }
                  />
                </td>
                <td>
                  <button onClick={() => removeIngredientRow(row.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={addIngredientRow}>+ Zutat hinzufügen</button>

        <div style={{ marginTop: "2rem" }}>
          <button onClick={handleSave} disabled={saving}>
            {saving ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
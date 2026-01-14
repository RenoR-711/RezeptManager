import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/categories";

// ------------------------------------------------------------
// Zutaten-Zeile in {amount, name} aufsplitten
// ------------------------------------------------------------
function parseIngredientLine(line) {
  if (!line) return { amount: "", name: "" };

  const parts = line.trim().split(/\s+/);

  // Fall: "200 g Mehl", "1 EL Zucker", "Prise Salz"
  if (parts.length >= 3) {
    return {
      amount: parts.slice(0, 2).join(" "), // Menge = 1–2 Wörter
      name: parts.slice(2).join(" "),
    };
  }

  // Fall: "2 Eier"
  if (parts.length === 2) {
    return {
      amount: parts[0],
      name: parts[1],
    };
  }

  // Nur Name
  return { amount: "", name: line.trim() };
}

/* -------------------------------------------------------------
 React-Komponente
------------------------------------------------------------- */
export default function UploadRecipeFile() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);

  const categories = CATEGORIES.map(c => c.name);

  // ------------------------------------------------------------
  // Datei wählen
  // ------------------------------------------------------------
  function handleFileChange(e) {
    setFile(e.target.files[0]);
    setRecipe(null);
    setError(null);
  }

  // -------------------------------------------------------------
  // Datei hochladen und analysieren
  // -------------------------------------------------------------
  async function handleScan() {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8081/api/scan/file-preview", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Analyse fehlgeschlagen");

      const data = await res.json();
      initFormFromResult(data);
    } catch (err) {
      setError(err.message);
    }
  }

  // -----------------------------
  // Rezept-Vorschau in Formular umwandeln (Backend)
  // -----------------------------
  function initFormFromResult(data) {
    // Zutaten-String -> Zeilen -> Amount/Name
    const ingredientRows =
      data.ingredients?.trim()
        ? data.ingredients
          .split(/\r?\n/)
          .map(parseIngredientLine)
        : [{ amount: "", name: "" }];

    setRecipe({
      title: data.title || "",
      description: data.description || "",
      ingredientsRows: ingredientRows,
      categories: [],
    });
  }

  // -----------------------------
  // Formular-Updates
  // -----------------------------
  function updateField(field, value) {
    setRecipe((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function toggleCategory(cat) {
    setRecipe((prev) => {
      const categories = prev.categories ?? [];
      return {
        ...prev,
        categories: categories.includes(cat)
          ? categories.filter((c) => c !== cat)
          : [...categories, cat],
      };
    });
  }


  function updateIngredientRow(index, field, value) {
    setRecipe((prev) => {
      const copy = [...prev.ingredientsRows];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, ingredientsRows: copy };
    });
  }

  function addIngredientRow() {
    setRecipe((prev) => ({
      ...prev,
      ingredientsRows: [...prev.ingredientsRows, { amount: "", name: "" }],
    }));
  }

  function removeIngredientRow(index) {
    setRecipe((prev) => {
      const copy = [...prev.ingredientsRows];
      copy.splice(index, 1);
      return {
        ...prev,
        ingredientsRows:
          copy.length > 0 ? copy : [{ amount: "", name: "" }],
      };
    });
  }

  // -----------------------------
  // Speichern
  // -----------------------------
  async function handleSave() {
    if (!recipe) return;

    setSaving(true);

    // Zutatenzeilen -> Text
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

      if (!res.ok) throw new Error("Speichern fehlgeschlagen");

      await res.json();
      navigate("/recipes");
    } catch (e) {
      alert(e.message);
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

      const imageUrl = await res.text();

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
  // UI
  // -------------------------------------------------------------
  return (
    <div className="page">
      <h2>Rezept aus Datei (PDF/Bild) einlesen</h2>

      <input type="file" accept=".pdf,image/*" onChange={handleFileChange} />

      <div style={{ marginTop: "1rem" }}>
        <button disabled={!file} onClick={handleScan}>
          Datei analysieren
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* FORMULAR - nur wenn Vorschau da ist */}
      {recipe && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Bearbeiten</h3>

          {/* TITEL */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="title" style={{ display: "block", marginBottom: "0.5rem" }}>
                Titel
              </label>
              <input
                id="title"
                type="text"
                value={recipe.title}
                onChange={(e) => updateField("title", e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label>
                Rezeptbild:
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "block", marginTop: "0.5rem" }}
                />
              </label>
            </div>

            <label htmlFor="categorie">Kategorien</label>
            <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
              {categories.map((cat) => (
                <label key={cat} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={recipe.categories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>

            {/* BESCHREIBUNG */}
            <label
              htmlFor="description"
              style={{ display: "block", marginBottom: "0.5rem" }}
            >
              Beschreibung
            </label>
            <textarea
              id="description"
              value={recipe.description}
              onChange={(e) =>
                updateField("description", e.target.value)
              }
              rows={5}
              style={{ width: "100%" }}
            />
          </div>

          {/* ZUTATEN-TABELLE */}
          <div>
            <h4>Zutaten</h4>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "1rem",
              }}
            >
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid #ccc" }}>Menge</th>
                  <th style={{ borderBottom: "1px solid #ccc" }}>Zutat</th>
                  <th style={{ borderBottom: "1px solid #ccc" }}>Aktion</th>
                </tr>
              </thead>

              <tbody>
                {recipe.ingredientsRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        value={row.amount}
                        onChange={(e) =>
                          updateIngredientRow(idx, "amount", e.target.value)
                        }
                        style={{ width: "70px" }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) =>
                          updateIngredientRow(idx, "name", e.target.value)
                        }
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td>
                      <button onClick={() => removeIngredientRow(idx)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={addIngredientRow}>+ Zutat hinzufügen</button>
          </div>

          {/* SPEICHERN */}
          <div style={{ marginTop: "2rem" }}>
            <button onClick={handleSave} disabled={saving}>
              {saving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import { useMemo } from "react";
import PropTypes from "prop-types";
import { CATEGORIES } from "../data/categories";

function getCategoryLabel(c) {
    return typeof c === "string" ? c : c?.name ?? "";
}

export default function RecipeForm({
    form,
    setForm,
    onSubmit,
    submitLabel = "Speichern",
    saving = false,
    error = "",
    onCancel,
    cancelLabel = "Abbrechen",
}) {
    const categoryOptions = useMemo(() => {
        return (CATEGORIES || []).map((c) => ({
            name: getCategoryLabel(c),
            color: typeof c === "object" ? c?.color : undefined,
        }));
    }, []);

    function toggleCategory(catName) {
        setForm((prev) => {
            const exists = prev.categories.includes(catName);
            return {
                ...prev,
                categories: exists
                    ? prev.categories.filter((c) => c !== catName)
                    : [...prev.categories, catName],
            };
        });
    }

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
            {error ? (
                <div
                    role="alert"
                    style={{
                        background: "#ffe5e5",
                        border: "1px solid #ffb3b3",
                        padding: 10,
                        borderRadius: 8,
                        marginBottom: 12,
                    }}
                >
                    {error}
                </div>
            ) : null}

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                {/* Titel */}
                <label style={{ display: "grid" }}>
                    <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                        Titel *
                    </span>
                    <input
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="z.B. Pasta Arrabiata"
                        required
                    />
                </label>

                {/* Zutaten */}
                <label style={{ display: "grid" }}>
                    <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                        Zutaten
                        
                    </span>
                    <textarea
                        value={form.ingredients}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, ingredients: e.target.value }))
                        }
                        placeholder={`z.B.\n- 200g Nudeln\n- 1 Dose Tomaten\n- Chili\n...`}
                        rows={6}
                    />
                </label>

                {/* Beschreibung */}
                <label style={{ display: "grid" }}>
                    <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                        Beschreibung
                    </span>
                    <textarea
                        value={form.description}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, description: e.target.value }))
                        }
                        placeholder="Kurze Beschreibung..."
                        rows={10}
                    />
                </label>



                {/* Kategorien */}
                <div style={{ display: "grid" }}>
                    <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                        Kategorien
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {categoryOptions.map((c) => {
                            const active = form.categories.includes(c.name);
                            return (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => toggleCategory(c.name)}
                                    aria-pressed={active}
                                    style={{
                                        background: active ? (c.color || "#555") : "#eee",
                                        color: active ? "white" : "#333",
                                        padding: "6px 10px",
                                        borderRadius: 999,
                                        border: "1px solid #ccc",
                                        cursor: "pointer",
                                        fontSize: "0.85rem",
                                    }}
                                >
                                    {c.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3er Grid: Zeiten / Meta / Nährwerte */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 12,
                    }}
                >
                    {/* Schwierigkeit */}
                    <div style={{ display: "grid" }}>
                        <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                            Schwierigkeit
                        </span>
                        <select
                            value={form.difficultyLevel}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, difficultyLevel: e.target.value }))
                            }
                        >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                        </select>
                    </div>

                    {/* Zubereitungszeit */}
                    <label style={{ display: "grid" }}>
                        <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                            Zubereitungszeit (Min.)
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={form.prepTimeMinutes}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, prepTimeMinutes: e.target.value }))
                            }
                            placeholder="z.B. 25"
                        />
                    </label>

                    {/* Kochzeit */}
                    <label style={{ display: "grid" }}>
                        <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                            Kochzeit (Min.)
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={form.cookTimeMinutes}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, cookTimeMinutes: e.target.value }))
                            }
                            placeholder="z.B. 15"
                        />
                    </label>

                    {/* Portionen */}
                    <label style={{ display: "grid" }}>
                        <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                            Portionen
                        </span>
                        <input
                            type="number"
                            min="1"
                            value={form.servings}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, servings: e.target.value }))
                            }
                            placeholder="z.B. 4"
                        />
                    </label>

                    {/* Kalorien */}
                    <label style={{ display: "grid" }}>
                        <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                            Kalorien
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={form.calories}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, calories: e.target.value }))
                            }
                            placeholder="z.B. 650"
                        />
                    </label>

                    {/* Bewertung */}
                    <label style={{ display: "grid" }}>
                        <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                            Bewertung (1–5)
                        </span>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={form.rating}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, rating: e.target.value }))
                            }
                            placeholder="z.B. 4"
                        />
                    </label>

                    {/* Protein */}
                    <label style={{ display: "grid" }}>
                        <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                            Protein (g)
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={form.protein}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, protein: e.target.value }))
                            }
                            placeholder="z.B. 30"
                        />
                    </label>

                    {/* Kohlenhydrate */}
                    <label style={{ display: "grid" }}>
                        <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                            Kohlenhydrate (g)
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={form.carbohydrates}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, carbohydrates: e.target.value }))
                            }
                            placeholder="z.B. 50"
                        />
                    </label>

                    {/* Fett */}
                    <label style={{ display: "grid" }}>
                        <span style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                            Fett (g)
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={form.fats}
                            onChange={(e) => setForm((p) => ({ ...p, fats: e.target.value }))}
                            placeholder="z.B. 20"
                        />
                    </label>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <button type="submit" className="btn primary" disabled={saving}>
                        {saving ? "Speichere..." : submitLabel}
                    </button>

                    {onCancel ? (
                        <button
                            type="button"
                            className="btn"
                            onClick={onCancel}
                            disabled={saving}
                        >
                            {cancelLabel}
                        </button>
                    ) : null}
                </div>
            </form>
        </div>
    );
}

RecipeForm.propTypes = {
    form: PropTypes.object.isRequired,
    setForm: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    submitLabel: PropTypes.string,
    saving: PropTypes.bool,
    error: PropTypes.string,
    onCancel: PropTypes.func,
    cancelLabel: PropTypes.string,
};
/* -------------------------------------------------------------
   Ende
------------------------------------------------------------- */
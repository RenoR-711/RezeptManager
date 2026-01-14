import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RecipeForm() {
    const navigate = useNavigate();

    const categoriesList = [
        "Vorspeise",
        "Hauptgericht",
        "Dessert",
        "Backen",
        "Getränke",
        "Salate",
    ];

    const [form, setForm] = useState({
        title: "",
        description: "",
        ingredients: "",
        categories: []   // <<< WICHTIG: Liste!
    });

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function toggleCategory(cat) {
        setForm(prev => {
            const exists = prev.categories.includes(cat);
            return {
                ...prev,
                categories: exists
                    ? prev.categories.filter(c => c !== cat)
                    : [...prev.categories, cat],
            };
        });
    }

    function handleSubmit(e) {
        e.preventDefault();

        fetch("http://localhost:8081/api/recipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        }).then(() => navigate("/recipes"));
    }

    return (
        <div className="page">
            <h2>Neues Rezept anlegen</h2>

            <form onSubmit={handleSubmit} style={{ maxWidth: "400px" }}>

                {/* Titel */}
                <label htmlFor="title">Titel</label>
                <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", marginBottom: "1rem" }}
                />

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

                {/* Kategorien (Mehrfachauswahl) */}
                <label>Kategorien</label>
                <div style={{ marginBottom: "1rem" }}>
                    {categoriesList.map(cat => (
                        <label
                            key={cat}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: ".4rem",
                                marginRight: "1rem",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={form.categories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                            />
                            {cat}
                        </label>
                    ))}
                </div>

                {/* Beschreibung */}
                <label>Beschreibung</label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    style={{ width: "100%", marginBottom: "1rem" }}
                />

                {/* Zutaten */}
                <label>Zutaten</label>
                <textarea
                    name="ingredients"
                    value={form.ingredients}
                    onChange={handleChange}
                    rows={4}
                    style={{ width: "100%", marginBottom: "1rem" }}
                />

                <button type="submit">Speichern</button>
            </form>
        </div>
    );
}

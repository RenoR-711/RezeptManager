import { useState } from "react";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [showIngredientsFirst, setShowIngredientsFirst] = useState(true);

  return (
    <div className="page" style={{ maxWidth: "600px" }}>
      <h1>Einstellungen</h1>
      <p>Hier kannst du einige Basis-Einstellungen für den RezeptManager vornehmen.</p>

      <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
          />
          Dark Mode (nur Demo – kein echtes Theme)
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={showIngredientsFirst}
            onChange={(e) => setShowIngredientsFirst(e.target.checked)}
          />
          Zutaten vor Beschreibung anzeigen (Demo-Einstellung)
        </label>
      </div>

      <p style={{ marginTop: "1.5rem", fontStyle: "italic" }}>
        Hinweis: Diese Einstellungen werden aktuell nur im Speicher gehalten
        und nicht dauerhaft gespeichert.
      </p>
    </div>
  );
}

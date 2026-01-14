import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>RezeptManager</h1>
      <p>Verwalte, scanne und erstelle Rezepte.</p>

      <nav style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Link to="/recipes">Rezepte ansehen</Link>
        <Link to="/recipes/new">Neues Rezept</Link>
        <Link to="/scan/image">Rezept per Foto scannen</Link>
        <Link to="/scan/file">Rezept aus Datei einlesen</Link>
        <Link to="/scan/barcode">Barcode (EAN) prüfen</Link>
      </nav>
    </div>
  );
}

import { useState } from "react";

export default function ScanBarcode() {
  const [ean, setEan] = useState("");
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  async function handleLookup(e) {
    e.preventDefault();
    setError(null);
    setProduct(null);

    try {
      const res = await fetch(`http://localhost:8081/api/scan/barcode/${ean}`);
      if (!res.ok) throw new Error("Anfrage fehlgeschlagen");
      const data = await res.json();
      setProduct(data);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Barcode scannen (EAN eingeben)</h2>
      <form onSubmit={handleLookup}>
        <input
          type="text"
          value={ean}
          onChange={(e) => setEan(e.target.value)}
          placeholder="EAN / Barcode-Nummer"
        />
        <button type="submit" disabled={!ean}>Suchen</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {product && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Produktdaten</h3>
          <p><strong>EAN:</strong> {product.ean}</p>
          <p><strong>Name:</strong> {product.name}</p>
          <p><strong>Marke:</strong> {product.brand}</p>
          <p><strong>Zutaten:</strong></p>
          <pre>{product.ingredientsText}</pre>
        </div>
      )}
    </div>
  );
}

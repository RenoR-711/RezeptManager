import { Link } from "react-router-dom";

export default function Categories() {
  const categories = [
    { name: "Vorspeise", img: "https://placehold.co/300x200?text=Vorspeise" },
    { name: "Hauptgericht", img: "https://placehold.co/300x200?text=Hauptgericht" },
    { name: "Dessert", img: "https://placehold.co/300x200?text=Dessert" },
    { name: "Backen", img: "https://placehold.co/300x200?text=Backen" },
    { name: "Getränke", img: "https://placehold.co/300x200?text=Getränke" },
    { name: "Salate", img: "https://placehold.co/300x200?text=Salate" },
  ];

  return (
    <div className="page">
      <h2>Kategorien</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1.2rem",
        }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.name}
            to={`/recipes?category=${encodeURIComponent(cat.name)}`}
            style={{
              background: "#fff",
              borderRadius: "10px",
              overflow: "hidden",
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
              transition: "0.2s",
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.15)";
            }}
          >
            <img
              src={cat.img}
              alt={cat.name}
              style={{
                width: "100%",
                height: "110px",
                objectFit: "cover",
              }}
            />

            <div
              style={{
                padding: "0.8rem",
                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: "600",
              }}
            >
              {cat.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

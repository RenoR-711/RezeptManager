export default function Contact() {
  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h1>Kontakt</h1>
      <p>
        Wenn du Feedback zum RezeptManager hast oder einen Fehler gefunden hast,
        kannst du mir hier eine Nachricht hinterlassen.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert("Danke für deine Nachricht! (Nur Demo, nichts wird gesendet)");
        }}
        style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <label>
          Name
          <input
            type="text"
            name="name"
            placeholder="Dein Name"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </label>

        <label>
          E-Mail
          <input
            type="email"
            name="email"
            placeholder="deine@mail.de"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </label>

        <label>
          Nachricht
          <textarea
            name="message"
            rows={5}
            placeholder="Worum geht es?"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </label>

        <button type="submit" style={{ padding: "0.5rem 1rem", marginTop: "0.5rem" }}>
          Nachricht senden
        </button>
      </form>
    </div>
  );
}

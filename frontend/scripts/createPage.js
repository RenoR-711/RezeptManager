import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname in ES Modules rekonstruieren
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const name = process.argv[2];

if (!name) {
  console.error(
    "Bitte einen Seitennamen angeben! Beispiel: npm run page Recipes"
  );
  process.exit(1);
}

const filePath = path.join(__dirname, "../src/pages", `${name}.jsx`);

const template = `
export default function ${name}() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>${name}</h1>
      <p>Dies ist die automatisch erzeugte Seite "${name}".</p>
    </div>
  );
}
`;

const pagesDir = path.join(__dirname, "../src/pages");

if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
}

fs.writeFileSync(filePath, template.trim());
console.log("✔ Seite erstellt:", filePath);

// scripts/createPageWithRoute.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const name = process.argv[2];

if (!name) {
    console.error(
        "Bitte einen Seitennamen angeben! Beispiel: npm run page:route About"
    );
    process.exit(1);
}

const pagesDir = path.join(__dirname, "../src/pages");
const appPath = path.join(__dirname, "../src/App.jsx");
const filePath = path.join(pagesDir, `${name}.jsx`);

const componentTemplate = `
export default function ${name}() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>${name}</h1>
      <p>Dies ist die automatisch erzeugte Seite "${name}".</p>
    </div>
  );
}
`;

if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
}

if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, componentTemplate.trim());
    console.log("✔ Seite erstellt:", filePath);
} else {
    console.log("ℹ Seite existiert bereits:", filePath);
}

// App.jsx bearbeiten
if (!fs.existsSync(appPath)) {
    console.error("❌ Konnte App.jsx nicht finden unter:", appPath);
    process.exit(1);
}

let appContent = fs.readFileSync(appPath, "utf-8");

// Import einfügen
const importMarker = "// ROUTE-IMPORTS";
const importLine = `import ${name} from "./pages/${name}";`;

if (!appContent.includes(importLine)) {
    appContent = appContent.replace(
        importMarker,
        `${importMarker}\n${importLine}`
    );
    console.log("✔ Import in App.jsx hinzugefügt");
} else {
    console.log("ℹ Import in App.jsx bereits vorhanden");
}

// Route einfügen
const routeMarker = "{/* ROUTE-PLACEHOLDER */}";
const routePath = `/${name.toLowerCase()}`;
const routeLine = `        <Route path="${routePath}" element={<${name} />} />`;

if (!appContent.includes(routeLine)) {
    appContent = appContent.replace(
        routeMarker,
        `${routeLine}\n        ${routeMarker}`
    );
    console.log("✔ Route in App.jsx hinzugefügt:", routePath);
} else {
    console.log("ℹ Route in App.jsx bereits vorhanden");
}

fs.writeFileSync(appPath, appContent);
console.log("✅ Fertig.");

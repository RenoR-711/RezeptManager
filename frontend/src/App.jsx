import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Recipes from "./pages/Recipes";
import RecipeList from "./pages/RecipeList";
import NewRecipe from "./pages/NewRecipe";
import EditRecipe from "./pages/EditRecipe";

import About from "./pages/About";
import Settings from "./pages/Settings";
import Contact from "./pages/Contact";

import ScanBarcode from "./pages/ScanBarcode";
import ScanRecipePdf from "./pages/ScanRecipePdf";
import UploadRecipeImage from "./pages/UploadRecipeImage";

import Navbar from "./components/Navbar";

import "./App.css";
import "./Recipes.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>

        {/* ================= START ================= */}
        <Route path="/" element={<Home />} />

        {/* ================= RECIPES ================= */}
        <Route path="/recipes" element={<RecipeList />} />
        <Route path="/recipes/category/:cat" element={<RecipeList />} />

        <Route path="/recipes/new" element={<NewRecipe />} />
        <Route path="/recipes/edit/:id" element={<EditRecipe />} />
        <Route path="/recipes/:id" element={<Recipes />} />

        {/* ================= SCAN ================= */}
        <Route path="/scan/file" element={<ScanRecipePdf />} />
        <Route path="/scan/image" element={<UploadRecipeImage />} />
        <Route path="/scan/barcode" element={<ScanBarcode />} />

        {/* ================= STATIC PAGES ================= */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/settings" element={<Settings />} />

      </Routes>
    </BrowserRouter>
  );
}
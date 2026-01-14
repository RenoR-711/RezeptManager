import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Recipes from "./pages/Recipes";        // Detailseite!
import RecipeList from "./pages/RecipeList";  // Liste!
import NewRecipe from "./pages/NewRecipe";
import EditRecipe from "./pages/EditRecipe";
import About from "./pages/About.jsx";
// ROUTE-IMPORTS
import Settings from "./pages/Settings";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";
import ScanRecipe from "./pages/ScanRecipe";
import UploadRecipeFile from "./pages/UploadRecipeFile";
import ScanBarcode from "./pages/ScanBarcode";

import './App.css';
import './index.css';


export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Liste */}
        <Route path="/recipes" element={<RecipeList />} />
          <Route path="/recipes/category/:cat" element={<RecipeList />} />

        {/* Detailseite */}
        <Route path="/recipes/:id" element={<Recipes />} />

        {/* Formulare */}
        <Route path="/recipes/new" element={<NewRecipe />} />
        <Route path="/recipes/edit/:id" element={<EditRecipe />} />

        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/settings" element={<Settings />} />

        {/* Scanner */}
        <Route path="/scan/image" element={<ScanRecipe />} />
        <Route path="/scan/file" element={<UploadRecipeFile />} />
        <Route path="/scan/barcode" element={<ScanBarcode />} />
      </Routes>
    </BrowserRouter>
  );
}
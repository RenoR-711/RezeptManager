import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";

export default function Navbar() {
    const [open, setOpen] = useState(false);

    const handleToggle = () => setOpen(!open);
    const handleClose = () => setOpen(false);

    return (
        <nav className="navbar">
            <div className="navbar__inner">
                <Link to="/" className="navbar__brand" onClick={handleClose}>
                    RezeptManager
                </Link>

                {/* Burger-Button für mobile */}
                <button
                    className="navbar__toggle"
                    onClick={handleToggle}
                    aria-label="Menü öffnen/schließen"
                >
                    ☰
                </button>

                {/* Links – auf Desktop immer sichtbar, auf Mobile ein-/ausklappbar */}
                <div className={`navbar__links ${open ? "navbar__links--open" : ""}`}>
                    <NavLink
                        to="/recipes"
                        className="navbar__link"
                        onClick={handleClose}
                    >
                        Rezepte
                    </NavLink>
                    <NavLink
                        to="/recipes/new"
                        className="navbar__link"
                        onClick={handleClose}
                    >
                        Neues Rezept
                    </NavLink>
                    <NavLink
                        to="/contact"
                        className="navbar__link"
                        onClick={handleClose}
                    >
                        Kontakt
                    </NavLink>
                    <NavLink
                        to="/settings"
                        className="navbar__link"
                        onClick={handleClose}
                    >
                        Einstellungen
                    </NavLink>
                </div>
            </div>
        </nav>
    );
}

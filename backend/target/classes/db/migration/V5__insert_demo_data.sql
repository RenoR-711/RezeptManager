-- Kategorien
INSERT INTO category (name) VALUES
('Vorspeise'),
('Hauptgericht'),
('Dessert'),
('Salat'),
('Getränk');

-- Rezept
INSERT INTO recipe (title, description, raw_text, source_file, image_path)
VALUES (
    'Spaghetti Bolognese',
    'Klassisches italienisches Nudelgericht',
    'Spaghetti\nHackfleisch\nTomaten\nZwiebeln\nKnoblauch',
    NULL,
    NULL
);

-- Verknüpfung Rezept ↔ Kategorie
INSERT INTO recipe_categories (recipe_id, category_id)
VALUES (
    1,
    (SELECT id FROM category WHERE name = 'Hauptgericht')
);

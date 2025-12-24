-- Migration: Add slug and schema_svg columns to rdm_types
-- Fixes: type_id NULL error and enables SVG schema display

-- Add slug column for human-readable identifiers
ALTER TABLE rdm_types ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Add schema_svg column for storing SVG schemas
ALTER TABLE rdm_types ADD COLUMN IF NOT EXISTS schema_svg TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_rdm_types_slug ON rdm_types(slug) WHERE slug IS NOT NULL;

-- Update existing types with slugs
UPDATE rdm_types SET slug = 'traction' WHERE name = 'Traction simple' AND slug IS NULL;
UPDATE rdm_types SET slug = 'compression' WHERE name = 'Compression' AND slug IS NULL;
UPDATE rdm_types SET slug = 'flexion' WHERE name = 'Flexion simple' AND slug IS NULL;
UPDATE rdm_types SET slug = 'torsion' WHERE name = 'Torsion' AND slug IS NULL;
UPDATE rdm_types SET slug = 'cisaillement' WHERE name = 'Cisaillement' AND slug IS NULL;

-- Insert new RDM types for structural mechanics (Prof Galimard's course)
INSERT INTO rdm_types (name, slug, description, formulas, variables, schema_svg) VALUES
('Poutre sur 2 appuis', 'poutre_2appuis',
 'Poutre isostatique reposant sur un appui double en A et un appui simple en B',
 '[{"name": "equilibre", "latex": "ΣFz = 0, ΣM = 0", "description": "Équations équilibre"}]'::jsonb,
 '[{"symbol": "L", "name": "Longueur totale", "unit": "m"}, {"symbol": "F", "name": "Force ponctuelle", "unit": "kN"}, {"symbol": "q", "name": "Charge répartie", "unit": "kN/m"}, {"symbol": "a", "name": "Position de la charge", "unit": "m"}]'::jsonb,
 '<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
  <line x1="50" y1="50" x2="350" y2="50" stroke="#333" stroke-width="4"/>
  <circle cx="50" cy="50" r="6" fill="#333"/>
  <circle cx="350" cy="50" r="6" fill="#333"/>
  <polygon points="50,60 40,80 60,80" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="35" y1="85" x2="65" y2="85" stroke="#333" stroke-width="2"/>
  <polygon points="350,60 340,80 360,80" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="335" y1="85" x2="365" y2="85" stroke="#333" stroke-width="2"/>
  <text x="50" y="105" text-anchor="middle" font-size="14" font-weight="bold">A</text>
  <text x="350" y="105" text-anchor="middle" font-size="14" font-weight="bold">B</text>
  <text x="200" y="35" text-anchor="middle" font-size="12">L</text>
  <line x1="60" y1="40" x2="340" y2="40" stroke="#666" stroke-width="1" stroke-dasharray="5,3"/>
</svg>')
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, schema_svg = EXCLUDED.schema_svg, description = EXCLUDED.description;

INSERT INTO rdm_types (name, slug, description, formulas, variables, schema_svg) VALUES
('Poutre console', 'console',
 'Poutre encastrée en A et libre en B (porte-à-faux)',
 '[{"name": "reactions", "latex": "XA, ZA, MA", "description": "Réactions encastrement"}]'::jsonb,
 '[{"symbol": "L", "name": "Longueur", "unit": "m"}, {"symbol": "F", "name": "Force en bout", "unit": "kN"}, {"symbol": "q", "name": "Charge répartie", "unit": "kN/m"}]'::jsonb,
 '<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="20" width="20" height="80" fill="url(#hatch)" stroke="#333" stroke-width="2"/>
  <defs><pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8"><path d="M0,8 l8,-8" stroke="#333" stroke-width="1"/></pattern></defs>
  <line x1="50" y1="50" x2="350" y2="50" stroke="#333" stroke-width="4"/>
  <circle cx="350" cy="50" r="6" fill="#333"/>
  <text x="40" y="115" text-anchor="middle" font-size="14" font-weight="bold">A</text>
  <text x="350" y="75" text-anchor="middle" font-size="14" font-weight="bold">B</text>
  <text x="200" y="35" text-anchor="middle" font-size="12">L</text>
</svg>')
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, schema_svg = EXCLUDED.schema_svg, description = EXCLUDED.description;

INSERT INTO rdm_types (name, slug, description, formulas, variables, schema_svg) VALUES
('Poutre hyperstatique degré 1', 'hyperstatique',
 'Poutre encastrée en A avec appui simple en C (hyperstatique degré 1)',
 '[{"name": "reactions", "latex": "XA, ZA, MA, ZC", "description": "Réactions aux appuis"}]'::jsonb,
 '[{"symbol": "LAB", "name": "Longueur tronçon AB", "unit": "m"}, {"symbol": "LBC", "name": "Longueur tronçon BC", "unit": "m"}, {"symbol": "F", "name": "Force ponctuelle", "unit": "kN"}, {"symbol": "q", "name": "Charge répartie", "unit": "kN/m"}]'::jsonb,
 '<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="20" width="20" height="80" fill="url(#hatch2)" stroke="#333" stroke-width="2"/>
  <defs><pattern id="hatch2" patternUnits="userSpaceOnUse" width="8" height="8"><path d="M0,8 l8,-8" stroke="#333" stroke-width="1"/></pattern></defs>
  <line x1="50" y1="50" x2="350" y2="50" stroke="#333" stroke-width="4"/>
  <circle cx="200" cy="50" r="4" fill="#333"/>
  <circle cx="350" cy="50" r="6" fill="#333"/>
  <polygon points="350,60 340,80 360,80" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="335" y1="85" x2="365" y2="85" stroke="#333" stroke-width="2"/>
  <text x="40" y="115" text-anchor="middle" font-size="14" font-weight="bold">A</text>
  <text x="200" y="75" text-anchor="middle" font-size="14" font-weight="bold">B</text>
  <text x="350" y="105" text-anchor="middle" font-size="14" font-weight="bold">C</text>
</svg>')
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, schema_svg = EXCLUDED.schema_svg, description = EXCLUDED.description;

INSERT INTO rdm_types (name, slug, description, formulas, variables, schema_svg) VALUES
('Portique simple', 'portique',
 'Structure en forme de portique avec montants et traverse',
 '[{"name": "reactions", "latex": "XA, ZA, MA, XC, ZC", "description": "Réactions portique"}]'::jsonb,
 '[{"symbol": "H", "name": "Hauteur montant", "unit": "m"}, {"symbol": "L", "name": "Portée traverse", "unit": "m"}, {"symbol": "F", "name": "Force horizontale", "unit": "kN"}, {"symbol": "q", "name": "Charge sur traverse", "unit": "kN/m"}]'::jsonb,
 '<svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="100" width="20" height="30" fill="url(#hatch3)" stroke="#333" stroke-width="2"/>
  <defs><pattern id="hatch3" patternUnits="userSpaceOnUse" width="8" height="8"><path d="M0,8 l8,-8" stroke="#333" stroke-width="1"/></pattern></defs>
  <line x1="50" y1="100" x2="50" y2="30" stroke="#333" stroke-width="4"/>
  <line x1="50" y1="30" x2="350" y2="30" stroke="#333" stroke-width="4"/>
  <line x1="350" y1="30" x2="350" y2="100" stroke="#333" stroke-width="4"/>
  <circle cx="350" cy="100" r="6" fill="#333"/>
  <polygon points="350,110 340,130 360,130" fill="none" stroke="#333" stroke-width="2"/>
  <text x="40" y="145" text-anchor="middle" font-size="14" font-weight="bold">A</text>
  <text x="200" y="20" text-anchor="middle" font-size="14" font-weight="bold">B</text>
  <text x="350" y="145" text-anchor="middle" font-size="14" font-weight="bold">C</text>
</svg>')
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, schema_svg = EXCLUDED.schema_svg, description = EXCLUDED.description;

-- Update existing types with SVG schemas
UPDATE rdm_types SET schema_svg =
'<svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
  <line x1="50" y1="50" x2="350" y2="50" stroke="#333" stroke-width="8"/>
  <polygon points="30,50 50,40 50,60" fill="#e74c3c"/>
  <polygon points="370,50 350,40 350,60" fill="#e74c3c"/>
  <text x="30" y="30" font-size="12" fill="#e74c3c">F</text>
  <text x="360" y="30" font-size="12" fill="#e74c3c">F</text>
  <text x="200" y="80" text-anchor="middle" font-size="12">L</text>
</svg>'
WHERE slug = 'traction' AND schema_svg IS NULL;

UPDATE rdm_types SET schema_svg =
'<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
  <line x1="50" y1="50" x2="350" y2="50" stroke="#333" stroke-width="4"/>
  <polygon points="50,60 40,80 60,80" fill="none" stroke="#333" stroke-width="2"/>
  <polygon points="350,60 340,80 360,80" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="200" y1="10" x2="200" y2="50" stroke="#e74c3c" stroke-width="2"/>
  <polygon points="200,50 195,35 205,35" fill="#e74c3c"/>
  <text x="215" y="25" font-size="12" fill="#e74c3c">P</text>
  <text x="50" y="100" text-anchor="middle" font-size="14" font-weight="bold">A</text>
  <text x="350" y="100" text-anchor="middle" font-size="14" font-weight="bold">B</text>
</svg>'
WHERE slug = 'flexion' AND schema_svg IS NULL;

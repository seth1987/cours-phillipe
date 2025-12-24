# Tâche 06 - Seed des Types RDM

## Contexte
Insérer les types d'exercices RDM prédéfinis dans la base de données : flexion, torsion, traction, thermique. Ces types système seront disponibles pour tous les professeurs.

## User Stories liées
- US-001 : En tant que Prof, je veux choisir un TYPE dans la bibliothèque

## Durée estimée
**1 heure**

## Requirements

### Checklist
- [ ] Créer le script SQL de seed
- [ ] Insérer les types de flexion (2 types)
- [ ] Insérer les types de torsion (2 types)
- [ ] Insérer les types de traction (2 types)
- [ ] Insérer les types thermiques (1 type)
- [ ] Vérifier que is_system = TRUE
- [ ] Tester la lecture des types

## Acceptance Criteria

1. ✅ 7 types système sont présents dans la table `types`
2. ✅ Tous ont `is_system = TRUE` et `created_by = NULL`
3. ✅ Les formules JSON sont valides et complètes
4. ✅ Les variables JSON incluent symbol, name, unit
5. ✅ Chaque type peut être sélectionné via l'API

## Technical Notes

### Structure JSONB formulas
```json
[
  {
    "name": "Mf",
    "latex": "M_f = \\frac{P \\times L}{4}",
    "code": "(P * L) / 4",
    "description": "Moment fléchissant max"
  }
]
```

### Structure JSONB variables
```json
[
  {
    "symbol": "P",
    "name": "Charge ponctuelle",
    "unit": "N",
    "description": "Force appliquée au centre"
  }
]
```

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/migrations/003_seed_types.sql` | Create | Données initiales |

## Dependencies (blockers)
- ✅ Tâche 03 - Database Schema

## SQL Script

```sql
-- 003_seed_types.sql

INSERT INTO types (name, category, description, formulas, variables, result_unit, is_system, created_by) VALUES

-- FLEXION 1: Poutre bi-appuyée charge ponctuelle
('Flexion poutre bi-appuyée - charge ponctuelle', 'flexion',
 'Poutre sur deux appuis simples avec charge ponctuelle au centre. Calcul de la contrainte normale maximale.',
 '[
   {"name": "Mf", "latex": "M_f = \\frac{P \\times L}{4}", "code": "(P * L) / 4", "description": "Moment fléchissant maximal au centre"},
   {"name": "I", "latex": "I = \\frac{b \\times h^3}{12}", "code": "(b * h^3) / 12", "description": "Moment d''inertie de la section rectangulaire"},
   {"name": "sigma", "latex": "\\sigma = \\frac{M_f \\times y}{I}", "code": "(Mf * (h/2)) / I", "description": "Contrainte normale maximale"}
 ]'::jsonb,
 '[
   {"symbol": "P", "name": "Charge ponctuelle", "unit": "N", "description": "Force appliquée au centre de la poutre"},
   {"symbol": "L", "name": "Longueur", "unit": "m", "description": "Portée de la poutre entre appuis"},
   {"symbol": "b", "name": "Largeur", "unit": "m", "description": "Largeur de la section rectangulaire"},
   {"symbol": "h", "name": "Hauteur", "unit": "m", "description": "Hauteur de la section rectangulaire"}
 ]'::jsonb,
 'Pa', TRUE, NULL),

-- FLEXION 2: Poutre encastrée-libre
('Flexion poutre encastrée-libre', 'flexion',
 'Poutre encastrée à une extrémité avec charge à l''extrémité libre (console). Calcul de la contrainte à l''encastrement.',
 '[
   {"name": "Mf", "latex": "M_f = P \\times L", "code": "P * L", "description": "Moment fléchissant maximal à l''encastrement"},
   {"name": "I", "latex": "I = \\frac{b \\times h^3}{12}", "code": "(b * h^3) / 12", "description": "Moment d''inertie de la section"},
   {"name": "sigma", "latex": "\\sigma = \\frac{M_f \\times y}{I}", "code": "(Mf * (h/2)) / I", "description": "Contrainte normale maximale"}
 ]'::jsonb,
 '[
   {"symbol": "P", "name": "Charge", "unit": "N", "description": "Force appliquée à l''extrémité libre"},
   {"symbol": "L", "name": "Longueur", "unit": "m", "description": "Longueur de la poutre console"},
   {"symbol": "b", "name": "Largeur", "unit": "m", "description": "Largeur de la section"},
   {"symbol": "h", "name": "Hauteur", "unit": "m", "description": "Hauteur de la section"}
 ]'::jsonb,
 'Pa', TRUE, NULL),

-- TORSION 1: Arbre cylindrique plein
('Torsion arbre cylindrique plein', 'torsion',
 'Arbre de section circulaire pleine soumis à un couple de torsion. Calcul de la contrainte de cisaillement maximale.',
 '[
   {"name": "Ip", "latex": "I_p = \\frac{\\pi \\times d^4}{32}", "code": "(PI * pow(d, 4)) / 32", "description": "Moment d''inertie polaire"},
   {"name": "tau", "latex": "\\tau = \\frac{M_t \\times r}{I_p}", "code": "(Mt * (d/2)) / Ip", "description": "Contrainte de cisaillement maximale en surface"}
 ]'::jsonb,
 '[
   {"symbol": "Mt", "name": "Moment de torsion", "unit": "N.m", "description": "Couple de torsion appliqué"},
   {"symbol": "d", "name": "Diamètre", "unit": "m", "description": "Diamètre de l''arbre"}
 ]'::jsonb,
 'Pa', TRUE, NULL),

-- TORSION 2: Arbre cylindrique creux
('Torsion arbre cylindrique creux', 'torsion',
 'Arbre de section annulaire (tube) soumis à un couple de torsion. Calcul de la contrainte de cisaillement maximale.',
 '[
   {"name": "Ip", "latex": "I_p = \\frac{\\pi \\times (D^4 - d^4)}{32}", "code": "(PI * (pow(D, 4) - pow(d, 4))) / 32", "description": "Moment d''inertie polaire du tube"},
   {"name": "tau", "latex": "\\tau = \\frac{M_t \\times R}{I_p}", "code": "(Mt * (D/2)) / Ip", "description": "Contrainte de cisaillement maximale"}
 ]'::jsonb,
 '[
   {"symbol": "Mt", "name": "Moment de torsion", "unit": "N.m", "description": "Couple de torsion appliqué"},
   {"symbol": "D", "name": "Diamètre extérieur", "unit": "m", "description": "Diamètre externe du tube"},
   {"symbol": "d", "name": "Diamètre intérieur", "unit": "m", "description": "Diamètre interne du tube"}
 ]'::jsonb,
 'Pa', TRUE, NULL),

-- TRACTION 1: Traction simple
('Traction simple', 'traction',
 'Barre soumise à un effort de traction axial. Calcul de la contrainte normale.',
 '[
   {"name": "sigma", "latex": "\\sigma = \\frac{F}{S}", "code": "F / S", "description": "Contrainte normale de traction"}
 ]'::jsonb,
 '[
   {"symbol": "F", "name": "Force", "unit": "N", "description": "Effort de traction axial"},
   {"symbol": "S", "name": "Section", "unit": "m²", "description": "Aire de la section transversale"}
 ]'::jsonb,
 'Pa', TRUE, NULL),

-- TRACTION 2: Allongement
('Allongement barre en traction', 'traction',
 'Calcul de l''allongement d''une barre soumise à un effort de traction.',
 '[
   {"name": "deltaL", "latex": "\\Delta L = \\frac{F \\times L}{E \\times S}", "code": "(F * L) / (E * S)", "description": "Allongement de la barre"}
 ]'::jsonb,
 '[
   {"symbol": "F", "name": "Force", "unit": "N", "description": "Effort de traction"},
   {"symbol": "L", "name": "Longueur", "unit": "m", "description": "Longueur initiale de la barre"},
   {"symbol": "E", "name": "Module de Young", "unit": "Pa", "description": "Module d''élasticité du matériau"},
   {"symbol": "S", "name": "Section", "unit": "m²", "description": "Aire de la section"}
 ]'::jsonb,
 'm', TRUE, NULL),

-- THERMIQUE 1: Contrainte thermique
('Contrainte thermique barre encastrée', 'thermique',
 'Contrainte développée dans une barre encastrée aux deux extrémités lors d''une variation de température.',
 '[
   {"name": "sigma", "latex": "\\sigma = E \\times \\alpha \\times \\Delta T", "code": "E * alpha * deltaT", "description": "Contrainte thermique"}
 ]'::jsonb,
 '[
   {"symbol": "E", "name": "Module de Young", "unit": "Pa", "description": "Module d''élasticité du matériau"},
   {"symbol": "alpha", "name": "Coefficient dilatation", "unit": "1/°C", "description": "Coefficient de dilatation thermique linéaire"},
   {"symbol": "deltaT", "name": "Variation température", "unit": "°C", "description": "Écart de température"}
 ]'::jsonb,
 'Pa', TRUE, NULL);
```

## Verification

```sql
-- Vérifier l'insertion
SELECT name, category, result_unit, is_system
FROM types
WHERE is_system = TRUE
ORDER BY category, name;

-- Devrait retourner 7 lignes
```

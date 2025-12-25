# Documentation - Générateur d'Exercices RDM

## Index des Documents

### 📊 Analyse du Schéma de Base de Données

1. **[Rapport d'Analyse Complet](./db-schema-analysis-report.md)** (⭐ PRINCIPAL)
   - Analyse détaillée des incohérences DB ↔ Code
   - Tables identifiées avec toutes les colonnes
   - Liste des problèmes critiques avec fichiers/lignes
   - Recommandations prioritaires
   - Plan de correction étape par étape

2. **[Diagramme Relationnel](./db-schema-diagram.md)**
   - Schéma visuel de la base de données
   - Relations entre tables (FK, CASCADE, SET NULL)
   - Historique des migrations
   - Contraintes et index
   - Triggers actifs

3. **[Guide de Correction Rapide](./db-quick-fix-guide.md)** (🚀 START HERE)
   - Résumé du problème en 1 phrase
   - Fichiers à modifier (2 fichiers)
   - Code AVANT/APRÈS avec lignes exactes
   - Mapping colonnes françaises → anglaises
   - Checklist de vérification post-correction

4. **[Requêtes SQL de Validation](./db-validation-queries.sql)**
   - Script SQL complet pour vérifier le schéma
   - Tests d'intégrité des colonnes
   - Vérification des contraintes CHECK
   - Tests d'insertion (dev uniquement)
   - Statistiques générales

---

## Résumé du Problème (TL;DR)

### 🔴 Problème Critique

Le code TypeScript utilise des colonnes françaises qui **n'existent pas** en base:
- ❌ `titre` → ✅ Devrait être `title`
- ❌ `enonce` → ✅ Devrait être `statement_template`
- ❌ `statut` → ✅ Devrait être `status`
- ❌ `plages` → ✅ Devrait être `variable_ranges`
- ❌ `type_id` → ✅ Devrait être `rdm_type_id`

**Impact:**
- Les exercices ne s'affichent pas correctement (pas de titre ni statut)
- L'insertion échoue ou insère des valeurs NULL
- Confusion pour les développeurs

**Solution:** Modifier 2 fichiers (voir [Guide de Correction Rapide](./db-quick-fix-guide.md))

---

## Structure de la Base de Données

### Tables Principales

```
auth.users (Supabase Auth)
    └─► profiles (nom, role, numero_etudiant en français)
        ├─► exercises (TOUT EN ANGLAIS: title, status, etc.)
        │   └─► exercise_instances
        │       └─► attempts
        └─► rdm_types (name, slug, schema_svg)
```

### Colonnes `exercises` (Référence)

| Colonne DB (RÉELLE) | Type | NOT NULL | Description |
|---------------------|------|----------|-------------|
| `id` | UUID | ✅ | Primary Key |
| `prof_id` | UUID | ✅ | FK → profiles.id |
| `rdm_type_id` | UUID | ❌ | FK → rdm_types.id |
| `title` | VARCHAR(255) | ✅ | Titre de l'exercice |
| `statement_template` | TEXT | ✅ | Énoncé avec variables |
| `formulas` | JSONB | ✅ | Formules disponibles |
| `variable_ranges` | JSONB | ✅ | Plages min/max |
| `tolerance_percent` | DECIMAL | ✅ | Tolérance (défaut: 5) |
| `difficulty` | VARCHAR(20) | ✅ | easy/medium/hard |
| `status` | VARCHAR(20) | ✅ | draft/validated/published/archived |
| `ai_generated` | BOOLEAN | ❌ | Généré par IA |
| `image_url` | TEXT | ❌ | URL image/schéma |
| `expected_answers` | JSONB | ❌ | Config réponses multiples |
| `solution` | TEXT | ❌ | Correction détaillée |
| `created_at` | TIMESTAMP | ✅ | Date création |
| `updated_at` | TIMESTAMP | ✅ | Dernière modif |

**Colonnes INEXISTANTES:**
- ❌ `titre`, `enonce`, `statut`, `plages`, `type_id`

---

## Migrations Appliquées

| Migration | Description | Impact |
|-----------|-------------|--------|
| `001_initial_schema.sql` | Schéma initial (TOUT EN ANGLAIS) | Tables créées |
| `002_rls_policies.sql` | Row Level Security | Sécurité par rôle |
| `003_auto_create_profile.sql` | Trigger auto-profile | Profil auto après signup |
| `004_multiple_answers_and_images.sql` | DECIMAL → JSONB + images | ⚠️ BREAKING CHANGE |
| `005_add_difficulty_and_solution.sql` | Ajout difficulty + solution | Colonnes supplémentaires |
| `006_add_slug_and_schema_svg.sql` | Slug + SVG pour rdm_types | Nouveaux types RDM |

---

## Fichiers Code Concernés

### 🔴 À Corriger IMMÉDIATEMENT

1. **`src/actions/exercises.ts`** (ligne 74-96)
   - Supprimer colonnes françaises dans `.insert()`
   - Supprimer `type_id`

2. **`src/app/(protected)/professeur/exercices/page.tsx`**
   - Interface Exercise: `titre` → `title`, `statut` → `status`
   - SELECT: idem
   - Affichage tableau: idem

### ✅ Fichiers Corrects

- `src/actions/rdm-types.ts` (utilise correctement `name`, `slug`, `schema_svg`)
- `src/actions/attempts.ts` (JSONB correct pour `given_answer`)
- `src/actions/students.ts` (colonnes françaises OK pour `profiles`)

---

## Tests de Validation

Après correction, exécuter:

```bash
# 1. Typecheck
npm run typecheck

# 2. Lint
npm run lint

# 3. Build
npm run build

# 4. Tests manuels
# - Créer un exercice
# - Vérifier affichage liste (titre + statut présents)
# - Vérifier que le type RDM est sauvegardé
```

---

## Contraintes Importantes

### CHECK Constraints

```sql
-- exercises.difficulty
CHECK (difficulty IN ('easy', 'medium', 'hard'))

-- exercises.status
CHECK (status IN ('draft', 'validated', 'published', 'archived'))

-- profiles.role
CHECK (role IN ('professeur', 'etudiant'))
```

**⚠️ IMPORTANT:** Utiliser des valeurs françaises (`'brouillon'`, `'validé'`) fera échouer l'INSERT.

### Valeurs Acceptées

| Concept | ❌ Valeur Française | ✅ Valeur Anglaise |
|---------|--------------------|--------------------|
| Brouillon | `brouillon` | `draft` |
| Validé | `validé` | `validated` |
| Publié | `publié` | `published` |
| Archivé | `archivé` | `archived` |

---

## Ordre de Lecture Recommandé

### Pour Développeurs (Correction Urgente)
1. 🚀 [Guide de Correction Rapide](./db-quick-fix-guide.md)
2. 🧪 [Requêtes SQL de Validation](./db-validation-queries.sql)
3. ✅ Appliquer corrections
4. ✅ Tester

### Pour Architectes/Lead Dev (Compréhension Complète)
1. 📊 [Rapport d'Analyse Complet](./db-schema-analysis-report.md)
2. 🗺️ [Diagramme Relationnel](./db-schema-diagram.md)
3. 🚀 [Guide de Correction Rapide](./db-quick-fix-guide.md)
4. 🧪 [Requêtes SQL de Validation](./db-validation-queries.sql)

### Pour QA/Test (Validation)
1. 🧪 [Requêtes SQL de Validation](./db-validation-queries.sql)
2. ✅ Checklist dans [Guide de Correction Rapide](./db-quick-fix-guide.md)

---

## Historique des Changements

| Date | Auteur | Action |
|------|--------|--------|
| 2025-12-25 | DB Schema Analyzer Agent | Audit initial du schéma DB |
| 2025-12-25 | DB Schema Analyzer Agent | Identification des incohérences |
| 2025-12-25 | DB Schema Analyzer Agent | Génération des rapports |

---

## Questions Fréquentes

### Q1: Pourquoi les exercices n'ont pas de titre dans la liste?
**R:** Le SELECT utilise `titre` (inexistant) au lieu de `title`.
→ Voir [Guide de Correction Rapide](./db-quick-fix-guide.md)

### Q2: Pourquoi l'insertion d'exercice échoue?
**R:** Le code tente d'insérer dans des colonnes françaises inexistantes.
→ Voir [Rapport d'Analyse Complet](./db-schema-analysis-report.md) section 2

### Q3: Faut-il renommer toutes les colonnes en français?
**R:** ❌ NON, c'est trop complexe et risqué.
✅ Modifier le code TypeScript pour utiliser les colonnes anglaises existantes.
→ Voir [Diagramme Relationnel](./db-schema-diagram.md) section "Recommandation Finale"

### Q4: Pourquoi `profiles` utilise `nom` (français) mais pas `exercises`?
**R:** Incohérence historique. Le schéma initial de `exercises` était en anglais.
`profiles` utilise des colonnes françaises car créé avec cette convention.
**Solution:** Garder tel quel, ne pas tout migrer.

### Q5: Comment vérifier que le schéma est correct?
**R:** Exécuter [Requêtes SQL de Validation](./db-validation-queries.sql) dans Supabase SQL Editor.

---

## Contacts & Ressources

- **Migrations SQL:** `supabase/migrations/*.sql`
- **Actions Supabase:** `src/actions/*.ts`
- **Configuration Supabase:** `src/lib/supabase/*.ts`
- **CLAUDE.md:** Règles projet (à mettre à jour post-correction)

---

**Documentation générée par:** DB Schema Analyzer Agent
**Date:** 2025-12-25
**Version:** 1.0

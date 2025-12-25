# Diagramme de Schéma DB - Générateur d'Exercices RDM

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        auth.users (Supabase)                     │
│  - id (UUID)                                                     │
│  - email                                                         │
│  - raw_user_meta_data                                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ FK (CASCADE DELETE)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          profiles                                │
│  - id (UUID, PK) ◄────── references auth.users.id              │
│  - email (VARCHAR 255, UNIQUE, NOT NULL)                       │
│  - nom (VARCHAR 255, NOT NULL) ◄── FRANÇAIS                    │
│  - role (VARCHAR 20, NOT NULL) ◄── 'professeur'/'etudiant'     │
│  - numero_etudiant (VARCHAR 50, NULL)                          │
│  - created_at, updated_at                                       │
└───────┬─────────────────────────┬───────────────────────────────┘
        │                         │
        │ FK (prof_id)            │ FK (student_id)
        ▼                         ▼
┌──────────────────┐    ┌──────────────────────────────────────┐
│   rdm_types      │    │            exercises                 │
│ - id (UUID, PK)  │◄───┤ - id (UUID, PK)                     │
│ - name (UNIQUE)  │    │ - prof_id (UUID, NOT NULL) FK       │
│ - slug (UNIQUE)  │    │ - rdm_type_id (UUID, NULL) FK ◄──── NULLABLE
│ - description    │    │                                      │
│ - formulas JSONB │    │ ❌ COLONNES FRANÇAISES INEXISTANTES: │
│ - variables JSONB│    │    titre, enonce, statut, plages    │
│ - schema_svg TEXT│    │                                      │
└──────────────────┘    │ ✅ COLONNES RÉELLES (ANGLAIS):       │
                        │ - title (VARCHAR 255, NOT NULL)      │
                        │ - statement_template (TEXT, NOT NULL)│
                        │ - formulas (JSONB, NOT NULL)         │
                        │ - variable_ranges (JSONB, NOT NULL)  │
                        │ - tolerance_percent (DECIMAL 5,2)    │
                        │ - difficulty (VARCHAR 20, NOT NULL)  │
                        │   CHECK: easy/medium/hard            │
                        │ - status (VARCHAR 20, NOT NULL)      │
                        │   CHECK: draft/validated/published/  │
                        │          archived                    │
                        │ - ai_generated (BOOLEAN)             │
                        │ - image_url (TEXT, NULL)             │
                        │ - expected_answers (JSONB)           │
                        │ - solution (TEXT, NULL)              │
                        │ - created_at, updated_at             │
                        └────────┬─────────────────────────────┘
                                 │
                                 │ FK (exercise_id)
                                 ▼
                        ┌──────────────────────────────────────┐
                        │       exercise_instances             │
                        │ - id (UUID, PK)                      │
                        │ - exercise_id (UUID, NOT NULL) FK    │
                        │ - student_id (UUID, NOT NULL) FK     │
                        │ - variable_values (JSONB, NOT NULL)  │
                        │ - statement_filled (TEXT, NOT NULL)  │
                        │ - expected_answer (JSONB, NOT NULL)  │
                        │   ◄── Migration 004: DECIMAL→JSONB   │
                        │ - completed (BOOLEAN)                │
                        │ - completed_at (TIMESTAMP)           │
                        │ - final_answer (JSONB, NULL)         │
                        │   ◄── Migration 004: DECIMAL→JSONB   │
                        │ - created_at                         │
                        │ UNIQUE(exercise_id, student_id)      │
                        └────────┬─────────────────────────────┘
                                 │
                                 │ FK (instance_id)
                                 ▼
                        ┌──────────────────────────────────────┐
                        │            attempts                  │
                        │ - id (UUID, PK)                      │
                        │ - instance_id (UUID, NOT NULL) FK    │
                        │ - student_id (UUID, NOT NULL) FK     │
                        │ - given_answer (JSONB, NOT NULL)     │
                        │   ◄── Migration 004: DECIMAL→JSONB   │
                        │ - is_correct (BOOLEAN, NOT NULL)     │
                        │ - deviation_percent (DECIMAL 10,4)   │
                        │ - answers_detail (JSONB)             │
                        │   ◄── Migration 004: Nouveau champ   │
                        │ - created_at                         │
                        └──────────────────────────────────────┘
```

---

## Légende

- **PK**: Primary Key
- **FK**: Foreign Key
- **NOT NULL**: Contrainte de non-nullité
- **UNIQUE**: Contrainte d'unicité
- **JSONB**: Type PostgreSQL JSON binaire
- **◄──**: Relation de clé étrangère
- **✅**: Colonnes correctes existantes
- **❌**: Colonnes utilisées dans le code mais inexistantes en DB

---

## Relations Clés

### 1. Cascade DELETE

```
auth.users (DELETE)
    └─► profiles (CASCADE DELETE)
        ├─► exercises (CASCADE DELETE si prof_id)
        │   └─► exercise_instances (CASCADE DELETE)
        │       └─► attempts (CASCADE DELETE)
        └─► exercise_instances (CASCADE DELETE si student_id)
            └─► attempts (CASCADE DELETE)
```

**Implication:** Supprimer un utilisateur supprime TOUTES ses données (exercices, instances, tentatives).

### 2. SET NULL sur rdm_types

```
rdm_types (DELETE)
    └─► exercises.rdm_type_id (SET NULL)
```

**Implication:** Supprimer un type RDM ne supprime pas les exercices, mais met `rdm_type_id` à NULL.

---

## Points de Friction Détectés

### 🔴 CRITIQUE: exercises.ts ligne 74-96

```typescript
.insert({
  // ❌ Colonne inexistante (sera ignorée)
  type_id: rdmTypeId,

  // ✅ Colonne correcte
  rdm_type_id: rdmTypeId,

  // ❌ Colonnes françaises (n'existent pas, seront ignorées)
  titre: formData.title,
  enonce: formData.statement_template,
  plages: formData.variable_ranges,
  statut: 'brouillon',

  // ✅ Colonnes anglaises (existent, seront enregistrées)
  title: formData.title,
  statement_template: formData.statement_template,
  formulas: formData.formulas,
  variable_ranges: formData.variable_ranges,
  tolerance_percent: formData.tolerance_percent,
  difficulty: formData.difficulty,
  status: 'draft',
  image_url: formData.image_url || null,
  expected_answers: formData.expected_answers || null,
  solution: formData.solution || null,
})
```

**Résultat:** PostgreSQL ignore les colonnes inconnues, seules les colonnes anglaises sont insérées.

### 🔴 CRITIQUE: page.tsx ligne 33-44

```typescript
.select(`
  id,
  titre,        // ❌ Colonne inexistante → retourne NULL
  statut,       // ❌ Colonne inexistante → retourne NULL
  difficulty,   // ✅ OK
  created_at,   // ✅ OK
  rdm_types (name)  // ✅ OK
`)
```

**Résultat:** Le tableau affiche des exercices sans titre ni statut.

---

## Mapping Correct vs Incorrect

### Table `exercises`

| Concept | ❌ Code Actuel (INCORRECT) | ✅ Schéma DB (CORRECT) |
|---------|---------------------------|------------------------|
| Titre | `titre` | `title` |
| Énoncé | `enonce` | `statement_template` |
| Statut | `statut` | `status` |
| Plages de variables | `plages` | `variable_ranges` |
| Type d'exercice | `type_id` | `rdm_type_id` |

### Valeurs `status`

| ❌ Valeur Française (CODE) | ✅ Valeur Anglaise (DB) | Description |
|---------------------------|-------------------------|-------------|
| `brouillon` | `draft` | Exercice en cours de création |
| `validé` | `validated` | Exercice validé par le prof |
| `publié` | `published` | Exercice accessible aux étudiants |
| `archivé` | `archived` | Exercice désactivé |

**Note:** Le CHECK constraint en DB n'accepte QUE les valeurs anglaises.

---

## Historique des Migrations

### Migration 001: Schéma Initial
- Création des tables `rdm_types`, `profiles`, `exercises`, `exercise_instances`, `attempts`
- Colonnes **entièrement en anglais**
- `difficulty` défini avec contrainte CHECK

### Migration 002: Row Level Security
- Activation RLS sur toutes les tables
- Politiques d'accès par rôle (professeur/etudiant)

### Migration 003: Auto-create Profile
- Trigger automatique après inscription
- Création profile avec données de `raw_user_meta_data`

### Migration 004: Multiple Answers + Images
- **BREAKING CHANGE:** DECIMAL → JSONB pour les réponses
  - `exercise_instances.expected_answer`
  - `exercise_instances.final_answer`
  - `attempts.given_answer`
- Ajout `image_url` à `exercises`
- Ajout `expected_answers` à `exercises`
- Ajout `answers_detail` à `attempts`

### Migration 005: Difficulty + Solution
- Ajout `difficulty` (était déjà dans 001, redondant)
- Ajout `solution` TEXT à `exercises`

### Migration 006: Slug + Schema SVG
- Ajout `slug` à `rdm_types`
- Ajout `schema_svg` TEXT à `rdm_types`
- Insertion de nouveaux types RDM:
  - Poutre sur 2 appuis
  - Poutre console
  - Poutre hyperstatique degré 1
  - Portique simple

---

## Index de Performance

### Table `exercises`
```sql
- idx_exercises_prof_id ON exercises(prof_id)
- idx_exercises_status ON exercises(status)
- idx_exercises_rdm_type ON exercises(rdm_type_id)
```

**Utilisation:**
- Requêtes filtrées par professeur: ✅ Optimisé
- Requêtes filtrées par statut: ✅ Optimisé
- JOIN avec rdm_types: ✅ Optimisé

### Table `exercise_instances`
```sql
- idx_exercise_instances_student ON exercise_instances(student_id)
- idx_exercise_instances_exercise ON exercise_instances(exercise_id)
```

**Utilisation:**
- Lister les exercices d'un étudiant: ✅ Optimisé
- Trouver les instances d'un exercice: ✅ Optimisé

### Table `attempts`
```sql
- idx_attempts_instance ON attempts(instance_id)
- idx_attempts_student ON attempts(student_id)
```

**Utilisation:**
- Historique des tentatives d'une instance: ✅ Optimisé
- Toutes les tentatives d'un étudiant: ✅ Optimisé

### Table `profiles`
```sql
- idx_profiles_role ON profiles(role)
```

**Utilisation:**
- Lister tous les étudiants/professeurs: ✅ Optimisé

---

## Contraintes d'Intégrité

### Contraintes NOT NULL Critiques

**Table `exercises`:**
- `prof_id` → Toujours renseigné via `user.id`
- `title` → Validé ligne 51-54 de `exercises.ts`
- `statement_template` → Validé ligne 51-54 de `exercises.ts`
- `formulas` → DEFAULT '[]'
- `variable_ranges` → DEFAULT '{}'
- `tolerance_percent` → DEFAULT 5.0
- `difficulty` → DEFAULT 'medium'
- `status` → DEFAULT 'draft'

**Table `exercise_instances`:**
- `exercise_id`, `student_id` → FK valides
- `variable_values` → DEFAULT '{}'
- `statement_filled` → Toujours généré
- `expected_answer` → Toujours calculé

**Table `attempts`:**
- `instance_id`, `student_id` → FK valides
- `given_answer` → Fourni par l'étudiant
- `is_correct` → Calculé automatiquement
- `deviation_percent` → Calculé automatiquement

### Contraintes CHECK

```sql
-- exercises.difficulty
CHECK (difficulty IN ('easy', 'medium', 'hard'))

-- exercises.status
CHECK (status IN ('draft', 'validated', 'published', 'archived'))

-- profiles.role
CHECK (role IN ('professeur', 'etudiant'))
```

**Note:** Utiliser des valeurs françaises comme `'brouillon'` ou `'validé'` fera échouer l'INSERT.

---

## Triggers Actifs

### 1. update_updated_at_column()
**Tables:** `profiles`, `exercises`

**Fonction:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Effet:** Met à jour automatiquement `updated_at` à chaque UPDATE.

### 2. handle_new_user()
**Table:** `auth.users`

**Fonction:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'professeur')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Effet:** Crée automatiquement un profil lors de l'inscription.

---

## Recommandation Finale

### Option 1: Tout en Anglais (RECOMMANDÉ)

**Avantages:**
- ✅ Cohérence avec le schéma DB
- ✅ Normes internationales
- ✅ Pas de migration nécessaire
- ✅ Facilite la maintenance

**Actions:**
- Supprimer colonnes françaises du code TypeScript
- Utiliser uniquement `title`, `status`, `statement_template`, etc.

### Option 2: Migration vers Français

**Avantages:**
- ✅ Code plus lisible pour équipe française
- ✅ Nommage cohérent avec `profiles` (déjà en français)

**Inconvénients:**
- ❌ Migration DB lourde
- ❌ Risque de casser RLS et triggers
- ❌ Pas standard international

**Actions nécessaires:**
```sql
-- Migration hypothétique (NON RECOMMANDÉ)
ALTER TABLE exercises RENAME COLUMN title TO titre;
ALTER TABLE exercises RENAME COLUMN statement_template TO enonce;
ALTER TABLE exercises RENAME COLUMN status TO statut;
ALTER TABLE exercises RENAME COLUMN variable_ranges TO plages;

-- Mise à jour des CHECK constraints
ALTER TABLE exercises DROP CONSTRAINT exercises_status_check;
ALTER TABLE exercises ADD CONSTRAINT exercises_statut_check
  CHECK (statut IN ('brouillon', 'validé', 'publié', 'archivé'));

-- Mise à jour des index
DROP INDEX idx_exercises_status;
CREATE INDEX idx_exercises_statut ON exercises(statut);
```

**Verdict:** ❌ NON RECOMMANDÉ (trop complexe, risque d'erreurs).

---

**Diagramme généré par:** DB Schema Analyzer Agent
**Date:** 2025-12-25

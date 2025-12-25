# Rapport DB Schema Analyzer
**Date:** 2025-12-25
**Projet:** Générateur d'Exercices RDM
**Analyste:** DB Schema Analyzer Agent

---

## Executive Summary

L'analyse du schéma de base de données Supabase révèle **des incohérences critiques** entre:
1. Le schéma SQL (colonnes en anglais)
2. Le code TypeScript (utilisation mixte français/anglais)
3. Les tentatives d'insertion qui échouent (colonnes françaises inexistantes)

**Verdict:** Le code utilise des noms de colonnes françaises (`titre`, `enonce`, `statut`, `plages`) qui **n'existent pas** dans le schéma de base de données. La base de données utilise uniquement des noms anglais.

---

## 1. Tables Identifiées dans le Schéma DB

### Table `exercises`
**Colonnes réelles (selon migrations SQL):**
```sql
- id (UUID, PK)
- prof_id (UUID, FK → profiles.id, NOT NULL)
- rdm_type_id (UUID, FK → rdm_types.id, NULL autorisé)
- title (VARCHAR(255), NOT NULL)
- statement_template (TEXT, NOT NULL)
- formulas (JSONB, NOT NULL, DEFAULT '[]')
- variable_ranges (JSONB, NOT NULL, DEFAULT '{}')
- tolerance_percent (DECIMAL(5,2), NOT NULL, DEFAULT 5.0)
- difficulty (VARCHAR(20), NOT NULL, DEFAULT 'medium', CHECK: easy/medium/hard)
- status (VARCHAR(20), NOT NULL, DEFAULT 'draft', CHECK: draft/validated/published/archived)
- ai_generated (BOOLEAN, DEFAULT FALSE)
- image_url (TEXT, NULL)
- expected_answers (JSONB, DEFAULT '[]')
- solution (TEXT, NULL)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
```

**Colonnes françaises ABSENTES:**
- ❌ `titre` (n'existe pas)
- ❌ `enonce` (n'existe pas)
- ❌ `statut` (n'existe pas)
- ❌ `plages` (n'existe pas)

### Table `rdm_types`
**Colonnes:**
```sql
- id (UUID, PK)
- name (VARCHAR(100), NOT NULL, UNIQUE)
- slug (VARCHAR(100), UNIQUE, nullable)
- description (TEXT)
- formulas (JSONB, DEFAULT '[]')
- variables (JSONB, DEFAULT '[]')
- schema_svg (TEXT)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
```

### Table `profiles`
**Colonnes:**
```sql
- id (UUID, PK, FK → auth.users.id)
- email (VARCHAR(255), NOT NULL, UNIQUE)
- nom (VARCHAR(255), NOT NULL)  ← FRANÇAIS
- role (VARCHAR(20), NOT NULL, CHECK: professeur/etudiant)  ← FRANÇAIS
- numero_etudiant (VARCHAR(50))  ← FRANÇAIS
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
```

### Table `exercise_instances`
**Colonnes:**
```sql
- id (UUID, PK)
- exercise_id (UUID, FK → exercises.id, NOT NULL)
- student_id (UUID, FK → profiles.id, NOT NULL)
- variable_values (JSONB, NOT NULL, DEFAULT '{}')
- statement_filled (TEXT, NOT NULL)
- expected_answer (JSONB, NOT NULL, migré depuis DECIMAL)
- completed (BOOLEAN, DEFAULT FALSE)
- completed_at (TIMESTAMP WITH TIME ZONE)
- final_answer (JSONB, migré depuis DECIMAL)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- UNIQUE(exercise_id, student_id)
```

### Table `attempts`
**Colonnes:**
```sql
- id (UUID, PK)
- instance_id (UUID, FK → exercise_instances.id, NOT NULL)
- student_id (UUID, FK → profiles.id, NOT NULL)
- given_answer (JSONB, NOT NULL, migré depuis DECIMAL)
- is_correct (BOOLEAN, NOT NULL, DEFAULT FALSE)
- deviation_percent (DECIMAL(10,4), NOT NULL)
- answers_detail (JSONB, DEFAULT '[]')
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
```

---

## 2. Incohérences Critiques DB ↔ Code

### 🔴 CRITIQUE: Colonnes françaises inexistantes

| Table | Colonne DB (RÉELLE) | Colonne Code (UTILISÉE) | Fichier | Lignes | Impact |
|-------|---------------------|-------------------------|---------|--------|--------|
| exercises | `title` | `titre` | src/actions/exercises.ts | 81, 37-38 | ❌ INSERT échoue |
| exercises | `statement_template` | `enonce` | src/actions/exercises.ts | 82 | ❌ INSERT échoue |
| exercises | `status` | `statut` | src/actions/exercises.ts | 84 | ❌ INSERT échoue |
| exercises | `variable_ranges` | `plages` | src/actions/exercises.ts | 83 | ❌ INSERT échoue |
| exercises | `title` | `titre` | src/app/(protected)/professeur/exercices/page.tsx | 37, 112 | ❌ SELECT retourne NULL |
| exercises | `status` | `statut` | src/app/(protected)/professeur/exercices/page.tsx | 38, 116 | ❌ SELECT retourne NULL |

### 🟡 AVERTISSEMENT: Insertions doubles (gaspillage)

**Fichier:** `src/actions/exercises.ts` ligne 74-96

```typescript
.insert({
  prof_id: user.id,
  type_id: rdmTypeId,           // ⚠️ Colonne inexistante
  rdm_type_id: rdmTypeId,       // ✅ Colonne correcte
  // Colonnes françaises (INEXISTANTES):
  titre: formData.title,                    // ❌ Échoue
  enonce: formData.statement_template,      // ❌ Échoue
  plages: formData.variable_ranges,         // ❌ Échoue
  statut: 'brouillon',                      // ❌ Échoue
  // Colonnes anglaises (CORRECTES):
  title: formData.title,                    // ✅ OK
  statement_template: formData.statement_template, // ✅ OK
  formulas: formData.formulas,              // ✅ OK
  variable_ranges: formData.variable_ranges, // ✅ OK
  tolerance_percent: formData.tolerance_percent, // ✅ OK
  difficulty: formData.difficulty,          // ✅ OK
  status: 'draft',                          // ✅ OK
  image_url: formData.image_url || null,    // ✅ OK
  expected_answers: formData.expected_answers || null, // ✅ OK
  solution: formData.solution || null,      // ✅ OK
})
```

**Problème:** Les colonnes françaises sont ignorées par PostgreSQL car inexistantes, ce qui fait échouer silencieusement l'insertion OU crée des valeurs NULL.

### 🟢 Colonnes correctes utilisées

| Table | Colonne | Utilisation | Fichier |
|-------|---------|-------------|---------|
| exercises | `difficulty` | ✅ Correcte | exercises.ts:91, page.tsx:39 |
| exercises | `created_at` | ✅ Correcte | page.tsx:40 |
| rdm_types | `name`, `slug`, `schema_svg` | ✅ Correctes | rdm-types.ts:20-21 |
| profiles | `nom`, `role`, `numero_etudiant` | ✅ Correctes (français accepté) | students.ts:47-49 |

---

## 3. Contraintes NOT NULL Potentiellement Violées

### Table `exercises`

| Colonne | Contrainte | Code actuel | Risque |
|---------|------------|-------------|--------|
| `title` | NOT NULL | ✅ Toujours fourni | Faible |
| `statement_template` | NOT NULL | ✅ Validation ligne 51-54 | Faible |
| `formulas` | NOT NULL (DEFAULT '[]') | ✅ Fourni avec default | Faible |
| `variable_ranges` | NOT NULL (DEFAULT '{}') | ✅ Fourni avec default | Faible |
| `prof_id` | NOT NULL | ✅ user.id vérifié | Faible |
| `rdm_type_id` | NULL autorisé | ⚠️ Peut être NULL (mais validation ligne 45-48) | Moyen |

**Note:** Les contraintes NOT NULL sont respectées pour les colonnes anglaises, mais le code tente d'utiliser des colonnes françaises inexistantes.

---

## 4. Problèmes dans les SELECTs

### Fichier: `src/app/(protected)/professeur/exercices/page.tsx`

**SELECT ligne 33-44:**
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

**Impact:** Les exercices affichés n'ont pas de titre ni de statut, car ces colonnes n'existent pas en base.

**Correction nécessaire:**
```typescript
.select(`
  id,
  title,        // ✅ Correct
  status,       // ✅ Correct
  difficulty,
  created_at,
  rdm_types (name)
`)
```

---

## 5. Colonne `type_id` vs `rdm_type_id`

**Problème détecté:** ligne 78-79 de `exercises.ts`

```typescript
type_id: rdmTypeId,       // ❌ Colonne inexistante
rdm_type_id: rdmTypeId,   // ✅ Colonne correcte
```

**Schéma DB:** Seule `rdm_type_id` existe (ligne 32 de `001_initial_schema.sql`).

**Recommandation:** Supprimer `type_id` du code.

---

## 6. Migration JSONB (`expected_answer`, `final_answer`, `given_answer`)

### Migration 004 (multiple_answers_and_images.sql)

**Transformations appliquées:**
- `exercise_instances.expected_answer`: DECIMAL → JSONB (ligne 14-18)
- `exercise_instances.final_answer`: DECIMAL → JSONB (ligne 22-26)
- `attempts.given_answer`: DECIMAL → JSONB (ligne 29-31)

**Code adapté:** ✅ Les fichiers `attempts.ts` et `tolerance.ts` utilisent correctement JSONB.

**Risque:** Faible, migration correctement implémentée.

---

## 7. Recommandations Prioritaires

### 🔴 URGENT (Bloquant)

1. **Supprimer toutes les références aux colonnes françaises dans `exercises.ts`:**
   - ❌ Supprimer: `titre`, `enonce`, `statut`, `plages`
   - ✅ Garder: `title`, `statement_template`, `status`, `variable_ranges`

2. **Corriger le SELECT dans `page.tsx`:**
   - Remplacer `titre` par `title`
   - Remplacer `statut` par `status`

3. **Supprimer la ligne `type_id`:**
   - Ligne 78 de `exercises.ts` (colonne inexistante)

### 🟡 IMPORTANT (Amélioration)

4. **Uniformiser la nomenclature:**
   - Option A: Tout en anglais (recommandé pour cohérence internationale)
   - Option B: Créer des VIEWs SQL avec alias français (plus complexe)

5. **Ajouter des tests TypeScript:**
   - Vérifier que les types TypeScript correspondent au schéma DB
   - Générer les types avec `supabase gen types typescript`

6. **Documentation:**
   - Créer un fichier `docs/schema-reference.md`
   - Documenter toutes les colonnes et leurs types

### 🟢 OPTIONNEL (Amélioration future)

7. **Migration pour ajouter colonnes françaises (SI VRAIMENT NÉCESSAIRE):**
   ```sql
   ALTER TABLE exercises
     ADD COLUMN titre VARCHAR(255) GENERATED ALWAYS AS (title) STORED,
     ADD COLUMN enonce TEXT GENERATED ALWAYS AS (statement_template) STORED,
     ADD COLUMN statut VARCHAR(20) GENERATED ALWAYS AS (status) STORED;
   ```
   ⚠️ Non recommandé: Augmente la complexité et la redondance.

---

## 8. Plan de Correction (Step by Step)

### Étape 1: Corriger `exercises.ts` (PRIORITÉ 1)

**Fichier:** `src/actions/exercises.ts`

**Modifications ligne 74-96:**
```typescript
// AVANT (INCORRECT):
.insert({
  prof_id: user.id,
  type_id: rdmTypeId,        // ❌ SUPPRIMER
  rdm_type_id: rdmTypeId,
  titre: formData.title,     // ❌ SUPPRIMER
  enonce: formData.statement_template,  // ❌ SUPPRIMER
  plages: formData.variable_ranges,     // ❌ SUPPRIMER
  statut: 'brouillon',       // ❌ SUPPRIMER
  title: formData.title,     // ✅ GARDER
  statement_template: formData.statement_template,  // ✅ GARDER
  formulas: formData.formulas,
  variable_ranges: formData.variable_ranges,
  tolerance_percent: formData.tolerance_percent,
  difficulty: formData.difficulty,
  status: 'draft',           // ✅ GARDER (pas 'brouillon')
  image_url: formData.image_url || null,
  expected_answers: formData.expected_answers || null,
  solution: formData.solution || null,
})

// APRÈS (CORRECT):
.insert({
  prof_id: user.id,
  rdm_type_id: rdmTypeId,
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

### Étape 2: Corriger `page.tsx` (PRIORITÉ 1)

**Fichier:** `src/app/(protected)/professeur/exercices/page.tsx`

**Modifications:**
```typescript
// Interface (ligne 16-25):
interface Exercise {
  id: string;
  title: string;      // ← Changer de 'titre'
  status: string;     // ← Changer de 'statut'
  difficulty: string;
  created_at: string;
  rdm_types: {
    name: string;
  } | { name: string }[] | null;
}

// SELECT (ligne 33-44):
.select(`
  id,
  title,        // ← Changer de 'titre'
  status,       // ← Changer de 'statut'
  difficulty,
  created_at,
  rdm_types (name)
`)

// Affichage (ligne 112-116):
<TableCell className="font-medium">{exercise.title}</TableCell>
<TableCell>
  <StatusBadge status={exercise.status} />
</TableCell>
```

### Étape 3: Mettre à jour `status-badge.tsx`

**Vérifier que le composant accepte les valeurs anglaises:**
- `draft` (pas `brouillon`)
- `validated` (pas `validé`)
- `published` (pas `publié`)
- `archived` (pas `archivé`)

### Étape 4: Tester

```bash
# 1. Linting
npm run lint

# 2. Typecheck
npm run typecheck

# 3. Test de création d'exercice
# (manuel via interface)
```

---

## 9. Fichiers à Modifier (Récapitulatif)

| Fichier | Lignes | Action | Priorité |
|---------|--------|--------|----------|
| `src/actions/exercises.ts` | 78-96 | Supprimer colonnes françaises + type_id | 🔴 Urgent |
| `src/app/(protected)/professeur/exercices/page.tsx` | 18-19, 37-38, 112, 116 | Remplacer titre→title, statut→status | 🔴 Urgent |
| `src/components/exercises/status-badge.tsx` | (à vérifier) | Vérifier mapping brouillon→draft | 🟡 Important |
| `CLAUDE.md` | N/A | Ajouter règle "Jamais de colonnes françaises pour exercises" | 🟢 Optionnel |

---

## 10. Vérifications Post-Correction

Après avoir appliqué les corrections, vérifier:

- [ ] Les exercices s'affichent avec un titre dans `/professeur/exercices`
- [ ] Le statut est affiché correctement
- [ ] Un nouvel exercice peut être créé sans erreur
- [ ] Le type RDM est correctement enregistré
- [ ] `npm run typecheck` passe sans erreur
- [ ] `npm run lint` passe sans erreur

---

## 11. Conclusion

### Résumé des Problèmes

1. **Incohérence française/anglaise:** Le code utilise des colonnes françaises (`titre`, `enonce`, `statut`, `plages`) qui n'existent pas dans le schéma PostgreSQL.

2. **Doublon inutile:** Les valeurs sont insérées deux fois (colonnes françaises + colonnes anglaises), mais seules les anglaises fonctionnent.

3. **Colonne `type_id` fantôme:** Utilisée dans le code mais inexistante dans la DB.

4. **SELECTs cassés:** La page liste renvoie NULL pour titre et statut.

### Impact Actuel

- ❌ **Les exercices ne s'affichent pas correctement** (pas de titre/statut)
- ❌ **L'insertion échoue** (colonnes inexistantes)
- ⚠️ **Confusion pour les développeurs** (noms français vs anglais)

### Après Correction

- ✅ Code aligné avec le schéma DB
- ✅ Pas de colonnes fantômes
- ✅ SELECTs retournent les bonnes données
- ✅ Maintenance facilitée

---

**Rapport généré par:** DB Schema Analyzer Agent
**Fichiers analysés:** 6 migrations SQL + 8 fichiers TypeScript
**Tables auditées:** exercises, rdm_types, profiles, exercise_instances, attempts
**Incohérences détectées:** 8 critiques, 3 avertissements

# Guide de Correction Rapide - Incohérences DB

## Résumé Problème

Le code utilise des colonnes françaises (`titre`, `enonce`, `statut`, `plages`) qui **n'existent pas** dans la base de données PostgreSQL. Seules les colonnes anglaises existent.

---

## Fichiers à Corriger (2 fichiers)

### 1. `src/actions/exercises.ts`

#### Ligne 74-96: Fonction `createExercise`

**AVANT (INCORRECT):**
```typescript
.insert({
  prof_id: user.id,
  type_id: rdmTypeId,        // ❌ SUPPRIMER (colonne inexistante)
  rdm_type_id: rdmTypeId,
  titre: formData.title,     // ❌ SUPPRIMER
  enonce: formData.statement_template,  // ❌ SUPPRIMER
  plages: formData.variable_ranges,     // ❌ SUPPRIMER
  statut: 'brouillon',       // ❌ SUPPRIMER
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

**APRÈS (CORRECT):**
```typescript
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

---

### 2. `src/app/(protected)/professeur/exercices/page.tsx`

#### A. Interface Exercise (ligne 16-25)

**AVANT (INCORRECT):**
```typescript
interface Exercise {
  id: string;
  titre: string;     // ❌ Changer en 'title'
  statut: string;    // ❌ Changer en 'status'
  difficulty: string;
  created_at: string;
  rdm_types: {
    name: string;
  } | { name: string }[] | null;
}
```

**APRÈS (CORRECT):**
```typescript
interface Exercise {
  id: string;
  title: string;     // ✅ Correct
  status: string;    // ✅ Correct
  difficulty: string;
  created_at: string;
  rdm_types: {
    name: string;
  } | { name: string }[] | null;
}
```

#### B. SELECT (ligne 33-44)

**AVANT (INCORRECT):**
```typescript
.select(`
  id,
  titre,        // ❌ Changer en 'title'
  statut,       // ❌ Changer en 'status'
  difficulty,
  created_at,
  rdm_types (name)
`)
```

**APRÈS (CORRECT):**
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

#### C. Affichage dans le tableau (ligne 112-116)

**AVANT (INCORRECT):**
```typescript
<TableCell className="font-medium">{exercise.titre}</TableCell>
<TableCell>
  <StatusBadge status={exercise.statut} />
</TableCell>
```

**APRÈS (CORRECT):**
```typescript
<TableCell className="font-medium">{exercise.title}</TableCell>
<TableCell>
  <StatusBadge status={exercise.status} />
</TableCell>
```

---

## Mapping Colonnes (Référence)

| Concept | ❌ Code Actuel | ✅ Schéma DB |
|---------|---------------|--------------|
| Titre | `titre` | `title` |
| Énoncé | `enonce` | `statement_template` |
| Statut | `statut` | `status` |
| Plages variables | `plages` | `variable_ranges` |
| Type RDM | `type_id` | `rdm_type_id` |

---

## Valeurs `status` Acceptées (CHECK constraint)

| ❌ Français (NON VALIDE) | ✅ Anglais (VALIDE) |
|-------------------------|---------------------|
| `brouillon` | `draft` |
| `validé` | `validated` |
| `publié` | `published` |
| `archivé` | `archived` |

**Important:** Utiliser des valeurs françaises fera échouer l'INSERT en base.

---

## Vérification Post-Correction

```bash
# 1. Typecheck
npm run typecheck

# 2. Lint
npm run lint

# 3. Test manuel
# - Créer un nouvel exercice
# - Vérifier qu'il apparaît dans la liste avec titre + statut
# - Vérifier que le type RDM est sauvegardé
```

---

## Tests de Validation

### Test 1: Création d'Exercice
```typescript
// Devrait réussir APRÈS correction
const result = await createExercise({
  title: "Test Exercise",
  rdm_type_slug: "traction",
  difficulty: "medium",
  statement_template: "Calculate stress with F={F} N and S={S} m²",
  formulas: [{ name: "sigma", formula: "F/S", unit: "Pa" }],
  variable_ranges: { F: { min: 100, max: 1000 }, S: { min: 0.01, max: 0.1 } },
  tolerance_percent: 5,
});

// Vérifier:
// - result.data existe
// - result.data.title === "Test Exercise"
// - result.data.status === "draft"
// - result.data.rdm_type_id est un UUID valide
```

### Test 2: Affichage Liste
```typescript
// Devrait afficher les exercices avec titre et statut
const exercises = await getExercises();

// Vérifier:
// - exercises[0].title existe (pas undefined)
// - exercises[0].status existe (pas undefined)
// - exercises[0].status est dans ['draft', 'validated', 'published', 'archived']
```

---

## Aide-Mémoire

### Colonnes `exercises` Réelles (DB)

```sql
-- Identifiants
id                  UUID PRIMARY KEY
prof_id             UUID NOT NULL FK → profiles.id
rdm_type_id         UUID FK → rdm_types.id

-- Contenu (ANGLAIS UNIQUEMENT)
title               VARCHAR(255) NOT NULL
statement_template  TEXT NOT NULL
formulas            JSONB NOT NULL DEFAULT '[]'
variable_ranges     JSONB NOT NULL DEFAULT '{}'
tolerance_percent   DECIMAL(5,2) NOT NULL DEFAULT 5.0
difficulty          VARCHAR(20) NOT NULL DEFAULT 'medium'
status              VARCHAR(20) NOT NULL DEFAULT 'draft'

-- Métadonnées
ai_generated        BOOLEAN DEFAULT FALSE
image_url           TEXT NULL
expected_answers    JSONB DEFAULT '[]'
solution            TEXT NULL
created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### Colonnes Inexistantes (Tentées dans le Code)

```
❌ titre
❌ enonce
❌ statut
❌ plages
❌ type_id
```

---

## Contact

Si des questions subsistent après correction:
- Voir `docs/db-schema-analysis-report.md` (rapport complet)
- Voir `docs/db-schema-diagram.md` (diagramme relationnel)
- Vérifier les migrations dans `supabase/migrations/`

---

**Temps estimé de correction:** 10-15 minutes
**Priorité:** 🔴 CRITIQUE (bloque la création d'exercices)

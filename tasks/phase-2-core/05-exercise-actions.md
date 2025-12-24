# Tâche 11 - Server Actions Exercices

## Contexte
Implémenter toutes les Server Actions pour la gestion des exercices : création, modification, validation, publication, archivage.

## User Stories liées
- US-001 : Choisir un TYPE dans la bibliothèque
- US-002 : Générer un exercice avec l'IA
- US-003 : Modifier l'énoncé et les plages
- US-005 : Valider puis publier un exercice
- US-006 : Définir une deadline optionnelle

## Durée estimée
**3-4 heures**

## Requirements

### Checklist
- [ ] Action `getTypes` - Liste des types disponibles
- [ ] Action `createExercise` - Créer un brouillon
- [ ] Action `updateExercise` - Modifier un exercice
- [ ] Action `validateExercise` - Passer en validé
- [ ] Action `publishExercise` - Publier + générer variantes
- [ ] Action `archiveExercise` - Archiver
- [ ] Action `deleteExercise` - Supprimer brouillon
- [ ] Action `getExercises` - Liste des exercices prof
- [ ] Action `getExercise` - Détail d'un exercice
- [ ] Validation des données avec Zod

## Acceptance Criteria

1. ✅ Toutes les actions sont protégées (auth required)
2. ✅ Le cycle de vie est respecté (draft→validated→published→archived)
3. ✅ La publication génère automatiquement les variantes
4. ✅ Les erreurs sont gérées et retournées proprement

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/actions/exercises.ts` | Create | Actions exercices |
| `src/actions/types.ts` | Create | Actions types |
| `src/lib/validation/schemas.ts` | Create | Schémas Zod |

## Dependencies (blockers)
- ✅ Tâche 02 - Supabase Setup
- ✅ Tâche 03 - Database Schema
- ✅ Tâche 05 - Auth System
- ✅ Tâche 08 - Formula Calculator
- ✅ Tâche 09 - Variant Generator

## Code Examples

### Schemas Zod (src/lib/validation/schemas.ts)
```typescript
import { z } from 'zod';

export const rangeConfigSchema = z.object({
  min: z.number(),
  max: z.number(),
  mode: z.enum(['libre', 'palier']),
  step: z.number().optional(),
  decimals: z.number().min(0).max(6).optional(),
});

export const createExerciseSchema = z.object({
  typeId: z.string().uuid(),
  statement: z.string().min(10).max(5000),
  ranges: z.record(rangeConfigSchema),
  solution: z.string().min(10),
  tolerance: z.number().min(0.1).max(20).default(2),
});

export const updateExerciseSchema = z.object({
  id: z.string().uuid(),
  statement: z.string().min(10).max(5000).optional(),
  ranges: z.record(rangeConfigSchema).optional(),
  solution: z.string().min(10).optional(),
  tolerance: z.number().min(0.1).max(20).optional(),
});

export const publishExerciseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(200),
  deadline: z.string().datetime().optional().nullable(),
  showCorrection: z.boolean().default(false),
});
```

### Types Actions (src/actions/types.ts)
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';

export async function getTypes(category?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('types')
    .select('*')
    .order('category')
    .order('name');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getType(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('types')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}
```

### Exercise Actions (src/actions/exercises.ts)
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  createExerciseSchema,
  updateExerciseSchema,
  publishExerciseSchema
} from '@/lib/validation/schemas';
import { generateVariantValues, fillStatement, extractUnits } from '@/lib/utils/variants';
import { calculateFinalAnswer } from '@/lib/formulas/calculator';

// ============ CREATE ============

export async function createExercise(formData: unknown) {
  const supabase = await createClient();

  // Vérifier auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Valider données
  const parsed = createExerciseSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { typeId, statement, ranges, solution, tolerance } = parsed.data;

  // Créer l'exercice en brouillon
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      type_id: typeId,
      title: 'Nouvel exercice',
      statement,
      ranges,
      solution,
      tolerance,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/prof/exercices');
  return { data };
}

// ============ UPDATE ============

export async function updateExercise(formData: unknown) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const parsed = updateExerciseSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { id, ...updates } = parsed.data;

  // Vérifier que l'exercice appartient au prof et n'est pas publié
  const { data: exercise } = await supabase
    .from('exercises')
    .select('status, created_by')
    .eq('id', id)
    .single();

  if (!exercise || exercise.created_by !== user.id) {
    return { error: 'Exercice non trouvé' };
  }

  if (exercise.status === 'published' || exercise.status === 'archived') {
    return { error: 'Impossible de modifier un exercice publié' };
  }

  const { data, error } = await supabase
    .from('exercises')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/prof/exercices/${id}`);
  return { data };
}

// ============ VALIDATE ============

export async function validateExercise(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: exercise } = await supabase
    .from('exercises')
    .select('status, created_by')
    .eq('id', id)
    .single();

  if (!exercise || exercise.created_by !== user.id) {
    return { error: 'Exercice non trouvé' };
  }

  if (exercise.status !== 'draft') {
    return { error: 'Seul un brouillon peut être validé' };
  }

  const { data, error } = await supabase
    .from('exercises')
    .update({ status: 'validated' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/prof/exercices/${id}`);
  return { data };
}

// ============ PUBLISH ============

export async function publishExercise(formData: unknown) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const parsed = publishExerciseSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { id, title, deadline, showCorrection } = parsed.data;

  // Récupérer l'exercice avec son type
  const { data: exercise } = await supabase
    .from('exercises')
    .select('*, type:types(*)')
    .eq('id', id)
    .single();

  if (!exercise || exercise.created_by !== user.id) {
    return { error: 'Exercice non trouvé' };
  }

  if (exercise.status !== 'validated') {
    return { error: 'Seul un exercice validé peut être publié' };
  }

  // Récupérer les étudiants du prof
  const { data: students } = await supabase
    .from('profiles')
    .select('id')
    .eq('created_by', user.id)
    .eq('role', 'student');

  if (!students || students.length === 0) {
    return { error: 'Aucun étudiant trouvé. Créez des comptes étudiants d\'abord.' };
  }

  // Mettre à jour l'exercice
  const { error: updateError } = await supabase
    .from('exercises')
    .update({
      title,
      status: 'published',
      deadline,
      show_correction: showCorrection,
      published_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    return { error: updateError.message };
  }

  // Générer les variantes pour chaque étudiant
  const units = extractUnits(exercise.type.variables);
  const formulas = exercise.type.formulas;

  const instances = students.map(student => {
    const values = generateVariantValues(exercise.ranges, id, student.id);
    const statementFilled = fillStatement(exercise.statement, values, units);
    const expectedAnswer = calculateFinalAnswer(formulas, values);

    return {
      exercise_id: id,
      student_id: student.id,
      values,
      statement_filled: statementFilled,
      expected_answer: expectedAnswer,
    };
  });

  const { error: instancesError } = await supabase
    .from('exercise_instances')
    .insert(instances);

  if (instancesError) {
    // Rollback status
    await supabase
      .from('exercises')
      .update({ status: 'validated', published_at: null })
      .eq('id', id);
    return { error: `Erreur génération variantes: ${instancesError.message}` };
  }

  revalidatePath('/prof/exercices');
  revalidatePath(`/prof/exercices/${id}`);
  return { data: { id, instancesCount: instances.length } };
}

// ============ ARCHIVE ============

export async function archiveExercise(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: exercise } = await supabase
    .from('exercises')
    .select('status, created_by')
    .eq('id', id)
    .single();

  if (!exercise || exercise.created_by !== user.id) {
    return { error: 'Exercice non trouvé' };
  }

  if (exercise.status !== 'published') {
    return { error: 'Seul un exercice publié peut être archivé' };
  }

  const { data, error } = await supabase
    .from('exercises')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/prof/exercices');
  return { data };
}

// ============ DELETE ============

export async function deleteExercise(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: exercise } = await supabase
    .from('exercises')
    .select('status, created_by')
    .eq('id', id)
    .single();

  if (!exercise || exercise.created_by !== user.id) {
    return { error: 'Exercice non trouvé' };
  }

  if (exercise.status !== 'draft') {
    return { error: 'Seul un brouillon peut être supprimé' };
  }

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/prof/exercices');
  return { success: true };
}

// ============ GET ============

export async function getExercises(status?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  let query = supabase
    .from('exercises')
    .select('*, type:types(name, category)')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getExercise(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('exercises')
    .select('*, type:types(*)')
    .eq('id', id)
    .eq('created_by', user.id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}
```

## Commands

```bash
# Installation Zod
npm install zod
```

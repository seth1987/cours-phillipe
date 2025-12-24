# Tâche 12 - Server Actions Étudiants

## Contexte
Implémenter les Server Actions pour la gestion des étudiants (création par le prof) et les actions côté étudiant (voir exercices, soumettre réponses).

## User Stories liées
- US-009 : Gérer les comptes étudiants
- US-010 : Voir mes exercices disponibles
- US-011 : Résoudre MON exercice avec MES valeurs
- US-012 : Soumettre ma réponse et avoir un feedback immédiat
- US-013 : Réessayer si j'ai échoué

## Durée estimée
**2-3 heures**

## Requirements

### Checklist
- [ ] Action `createStudent` - Créer un compte étudiant
- [ ] Action `getStudents` - Liste des étudiants du prof
- [ ] Action `deleteStudent` - Supprimer un étudiant
- [ ] Action `getStudentExercises` - Liste exercices pour étudiant
- [ ] Action `getStudentInstance` - Variante de l'étudiant
- [ ] Action `submitAnswer` - Soumettre une réponse
- [ ] Action `getAttempts` - Historique des tentatives

## Acceptance Criteria

1. ✅ Le prof peut créer des comptes étudiants
2. ✅ L'étudiant voit uniquement les exercices publiés de son prof
3. ✅ L'étudiant voit sa variante unique (ses valeurs)
4. ✅ La soumission vérifie la réponse et retourne le feedback
5. ✅ L'étudiant peut réessayer sans limite

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/actions/students.ts` | Create | Actions gestion étudiants |
| `src/actions/attempts.ts` | Create | Actions soumissions |

## Dependencies (blockers)
- ✅ Tâche 05 - Auth System
- ✅ Tâche 10 - Tolerance Checker
- ✅ Tâche 11 - Exercise Actions

## Code Examples

### Students Actions (src/actions/students.ts)
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createStudentSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  password: z.string().min(8),
});

export async function createStudent(formData: unknown) {
  const supabase = await createClient();

  // Vérifier que c'est un prof
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'prof') {
    return { error: 'Seul un professeur peut créer des étudiants' };
  }

  // Valider données
  const parsed = createStudentSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email, fullName, password } = parsed.data;

  // Créer l'utilisateur via l'API admin Supabase
  // Note: Nécessite SUPABASE_SERVICE_ROLE_KEY
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Confirmer l'email automatiquement
  });

  if (authError) {
    return { error: authError.message };
  }

  // Créer le profil étudiant
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role: 'student',
      created_by: user.id,
    });

  if (profileError) {
    // Rollback: supprimer l'utilisateur auth
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  revalidatePath('/prof/etudiants');
  return {
    data: {
      id: authData.user.id,
      email,
      fullName,
    }
  };
}

export async function getStudents() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at')
    .eq('created_by', user.id)
    .eq('role', 'student')
    .order('full_name');

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function deleteStudent(studentId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Vérifier que l'étudiant appartient au prof
  const { data: student } = await supabase
    .from('profiles')
    .select('created_by')
    .eq('id', studentId)
    .single();

  if (!student || student.created_by !== user.id) {
    return { error: 'Étudiant non trouvé' };
  }

  // Supprimer via admin API
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabaseAdmin.auth.admin.deleteUser(studentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/prof/etudiants');
  return { success: true };
}

// ============ STUDENT SIDE ============

export async function getStudentExercises() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Récupérer le prof de l'étudiant
  const { data: profile } = await supabase
    .from('profiles')
    .select('created_by')
    .eq('id', user.id)
    .single();

  if (!profile?.created_by) {
    return { error: 'Profil étudiant invalide' };
  }

  // Récupérer les exercices publiés avec les instances de cet étudiant
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      id,
      title,
      deadline,
      status,
      show_correction,
      type:types(name, category),
      instance:exercise_instances!inner(
        id,
        statement_filled,
        values
      )
    `)
    .eq('created_by', profile.created_by)
    .in('status', ['published', 'archived'])
    .eq('exercise_instances.student_id', user.id)
    .order('published_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  // Enrichir avec le statut de completion
  const enriched = await Promise.all(
    data.map(async (exercise) => {
      const instanceId = exercise.instance[0]?.id;
      if (!instanceId) return { ...exercise, completionStatus: 'not_started' };

      const { data: attempts } = await supabase
        .from('attempts')
        .select('is_correct')
        .eq('instance_id', instanceId)
        .order('created_at', { ascending: false })
        .limit(1);

      let completionStatus = 'not_started';
      if (attempts && attempts.length > 0) {
        completionStatus = attempts[0].is_correct ? 'success' : 'attempted';
      }

      return { ...exercise, completionStatus };
    })
  );

  return { data: enriched };
}

export async function getStudentInstance(exerciseId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('exercise_instances')
    .select(`
      id,
      values,
      statement_filled,
      exercise:exercises(
        id,
        title,
        image_url,
        status,
        show_correction,
        solution,
        deadline,
        type:types(name, result_unit)
      )
    `)
    .eq('exercise_id', exerciseId)
    .eq('student_id', user.id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}
```

### Attempts Actions (src/actions/attempts.ts)
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkAnswer } from '@/lib/utils/tolerance';
import { z } from 'zod';

const submitAnswerSchema = z.object({
  instanceId: z.string().uuid(),
  answer: z.number().finite(),
});

export async function submitAnswer(formData: unknown) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const parsed = submitAnswerSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { instanceId, answer } = parsed.data;

  // Récupérer l'instance avec l'exercice
  const { data: instance, error: instanceError } = await supabase
    .from('exercise_instances')
    .select(`
      id,
      student_id,
      expected_answer,
      exercise:exercises(
        id,
        status,
        tolerance,
        deadline
      )
    `)
    .eq('id', instanceId)
    .single();

  if (instanceError || !instance) {
    return { error: 'Instance non trouvée' };
  }

  // Vérifier que c'est bien l'étudiant propriétaire
  if (instance.student_id !== user.id) {
    return { error: 'Accès non autorisé' };
  }

  // Vérifier que l'exercice est toujours ouvert
  const exercise = instance.exercise;
  if (exercise.status !== 'published') {
    return { error: 'Cet exercice est fermé' };
  }

  // Vérifier la deadline
  if (exercise.deadline && new Date(exercise.deadline) < new Date()) {
    return { error: 'La date limite est dépassée' };
  }

  // Vérifier la réponse
  const result = checkAnswer(
    answer,
    Number(instance.expected_answer),
    exercise.tolerance
  );

  // Enregistrer la tentative
  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .insert({
      instance_id: instanceId,
      answer,
      is_correct: result.isCorrect,
      deviation: result.deviation,
    })
    .select()
    .single();

  if (attemptError) {
    return { error: attemptError.message };
  }

  revalidatePath(`/student/exercices/${exercise.id}`);

  return {
    data: {
      attemptId: attempt.id,
      isCorrect: result.isCorrect,
      deviation: result.deviation,
      // Ne pas révéler la réponse attendue tant que l'exercice n'est pas archivé
      message: result.isCorrect
        ? 'Bravo ! Réponse correcte.'
        : `Incorrect. Écart de ${result.deviation}% (tolérance ±${exercise.tolerance}%). Réessayez !`,
    }
  };
}

export async function getAttempts(instanceId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Vérifier que l'instance appartient à l'utilisateur
  const { data: instance } = await supabase
    .from('exercise_instances')
    .select('student_id')
    .eq('id', instanceId)
    .single();

  if (!instance || instance.student_id !== user.id) {
    return { error: 'Accès non autorisé' };
  }

  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('instance_id', instanceId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

// Pour le prof: voir toutes les tentatives d'un exercice
export async function getExerciseAttempts(exerciseId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Vérifier que l'exercice appartient au prof
  const { data: exercise } = await supabase
    .from('exercises')
    .select('created_by')
    .eq('id', exerciseId)
    .single();

  if (!exercise || exercise.created_by !== user.id) {
    return { error: 'Exercice non trouvé' };
  }

  const { data, error } = await supabase
    .from('exercise_instances')
    .select(`
      id,
      values,
      expected_answer,
      student:profiles!student_id(id, full_name, email),
      attempts(
        id,
        answer,
        is_correct,
        deviation,
        created_at
      )
    `)
    .eq('exercise_id', exerciseId)
    .order('student.full_name');

  if (error) {
    return { error: error.message };
  }

  return { data };
}
```

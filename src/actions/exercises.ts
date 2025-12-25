'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createExerciseSchema, updateExerciseSchema } from '@/lib/validation/schemas';

interface ExpectedAnswerConfig {
  name: string;
  formula: string;
  unit: string;
  tolerance: number;
}

interface CreateExerciseInput {
  title: string;
  rdm_type_slug?: string;  // Slug du type RDM (sera converti en UUID)
  difficulty: 'easy' | 'medium' | 'hard';
  statement_template: string;
  formulas: Array<{ name: string; formula: string; unit: string }>;
  variable_ranges: Record<string, { min: number; max: number; step?: number }>;
  tolerance_percent: number;
  image_url?: string;
  expected_answers?: ExpectedAnswerConfig[];
  solution?: string;
}

export async function createExercise(formData: CreateExerciseInput) {
  console.log('[CREATE-EXERCISE] === Creating exercise ===');
  console.log('[CREATE-EXERCISE] Full formData received:', JSON.stringify(formData, null, 2));
  console.log('[CREATE-EXERCISE] Input rdm_type_slug:', formData.rdm_type_slug);

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const parsed = createExerciseSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Validate that rdm_type_slug is provided (required by database)
  if (!formData.rdm_type_slug) {
    console.error('[CREATE-EXERCISE] ERROR: rdm_type_slug is missing!');
    return { error: 'Le type RDM est obligatoire' };
  }

  // Validate that statement_template is provided (required by database)
  if (!formData.statement_template) {
    console.error('[CREATE-EXERCISE] ERROR: statement_template is missing!');
    return { error: "L'énoncé de l'exercice est obligatoire" };
  }

  // Lookup rdm_type_id from slug
  const { data: typeData, error: typeError } = await supabase
    .from('rdm_types')
    .select('id')
    .eq('slug', formData.rdm_type_slug)
    .single();

  console.log('[CREATE-EXERCISE] Type lookup result:', { typeData, typeError });

  if (typeError || !typeData) {
    console.error('[CREATE-EXERCISE] ERROR: Type not found for slug:', formData.rdm_type_slug);
    return { error: `Type RDM "${formData.rdm_type_slug}" introuvable` };
  }

  const rdmTypeId = typeData.id;
  console.log('[CREATE-EXERCISE] Using rdm_type_id:', rdmTypeId);
  console.log('[CREATE-EXERCISE] About to insert with type_id:', rdmTypeId);

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      prof_id: user.id,
      type_id: rdmTypeId,
      rdm_type_id: rdmTypeId,
      // French column names (required by database NOT NULL constraints)
      titre: formData.title,
      enonce: formData.statement_template,
      plages: formData.variable_ranges,
      statut: 'brouillon',
      // English column names (kept for compatibility)
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
    .select()
    .single();

  if (error) {
    console.error('[CREATE-EXERCISE] INSERT ERROR:', error.message);
    console.error('[CREATE-EXERCISE] Error details:', JSON.stringify(error, null, 2));
    return { error: error.message };
  }

  console.log('[CREATE-EXERCISE] SUCCESS! Created exercise:', data?.id);
  console.log('[CREATE-EXERCISE] Returned data:', JSON.stringify(data, null, 2));

  revalidatePath('/professeur/exercices');
  return { data };
}

export async function updateExercise(formData: unknown) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const parsed = updateExerciseSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { id, ...updates } = parsed.data;

  const { data: exercise } = await supabase
    .from('exercises')
    .select('statut, prof_id')
    .eq('id', id)
    .single();

  if (!exercise || exercise.prof_id !== user.id) {
    return { error: 'Exercice non trouvé' };
  }

  if (exercise.statut === 'publie' || exercise.statut === 'archive') {
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

  revalidatePath(`/professeur/exercices/${id}`);
  return { data };
}

export async function validateExercise(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: exercise } = await supabase
    .from('exercises')
    .select('statut, prof_id')
    .eq('id', id)
    .single();

  if (!exercise || exercise.prof_id !== user.id) {
    return { error: 'Exercice non trouvé' };
  }

  if (exercise.statut !== 'brouillon') {
    return { error: 'Seul un brouillon peut être validé' };
  }

  const { data, error } = await supabase
    .from('exercises')
    .update({ statut: 'valide' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/professeur/exercices/${id}`);
  return { data };
}

export async function publishExercise(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: exercise } = await supabase
    .from('exercises')
    .select('statut, prof_id')
    .eq('id', id)
    .single();

  if (!exercise || exercise.prof_id !== user.id) {
    return { error: 'Exercice non trouvé' };
  }

  if (exercise.statut !== 'valide') {
    return { error: 'Seul un exercice validé peut être publié' };
  }

  const { data, error } = await supabase
    .from('exercises')
    .update({ statut: 'publie' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/professeur/exercices');
  revalidatePath(`/professeur/exercices/${id}`);
  return { data };
}

export async function archiveExercise(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: exercise } = await supabase
    .from('exercises')
    .select('statut, prof_id')
    .eq('id', id)
    .single();

  if (!exercise || exercise.prof_id !== user.id) {
    return { error: 'Exercice non trouvé' };
  }

  if (exercise.statut !== 'publie') {
    return { error: 'Seul un exercice publié peut être archivé' };
  }

  const { data, error } = await supabase
    .from('exercises')
    .update({ statut: 'archive' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/professeur/exercices');
  return { data };
}

export async function deleteExercise(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: exercise } = await supabase
    .from('exercises')
    .select('statut, prof_id')
    .eq('id', id)
    .single();

  if (!exercise || exercise.prof_id !== user.id) {
    return { error: 'Exercice non trouvé' };
  }

  if (exercise.statut !== 'brouillon') {
    return { error: 'Seul un brouillon peut être supprimé' };
  }

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/professeur/exercices');
  return { success: true };
}

export async function getExercises(status?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  let query = supabase
    .from('exercises')
    .select('*, rdm_types(name)')
    .eq('prof_id', user.id)
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
    .select('*, rdm_types(*)')
    .eq('id', id)
    .eq('prof_id', user.id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

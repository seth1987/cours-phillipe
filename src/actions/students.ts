'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface CreateStudentInput {
  email: string;
  nom: string;
  numero_etudiant: string;
  password: string;
}

export async function createStudent(formData: CreateStudentInput) {
  const supabase = await createClient();
  const adminClient = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'professeur') {
    return { error: 'Seuls les professeurs peuvent créer des étudiants' };
  }

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
  });

  if (authError) {
    return { error: authError.message };
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: formData.email,
      nom: formData.nom,
      numero_etudiant: formData.numero_etudiant,
      role: 'etudiant',
    });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  revalidatePath('/professeur/etudiants');
  return { data: { id: authData.user.id } };
}

export async function getStudents() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, nom, numero_etudiant, created_at')
    .eq('role', 'etudiant')
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function deleteStudent(id: string) {
  const supabase = await createClient();
  const adminClient = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'professeur') {
    return { error: 'Non autorisé' };
  }

  const { error } = await adminClient.auth.admin.deleteUser(id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/professeur/etudiants');
  return { success: true };
}

export async function getStudentExercises() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('exercise_instances')
    .select(`
      id,
      completed,
      completed_at,
      exercises (
        id,
        title,
        difficulty,
        rdm_types (name)
      )
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getStudentInstance(instanceId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('exercise_instances')
    .select(`
      id,
      variable_values,
      statement_filled,
      completed,
      final_answer,
      expected_answer,
      exercises (
        id,
        title,
        tolerance_percent,
        formulas,
        image_url,
        expected_answers,
        rdm_types (name, schema_svg)
      )
    `)
    .eq('id', instanceId)
    .eq('student_id', user.id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

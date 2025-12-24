'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkMultipleAnswers, ExpectedAnswer, GivenAnswer } from '@/lib/utils/tolerance';

interface SubmitAnswersInput {
  instance_id: string;
  answers: GivenAnswer[];
}

export async function submitAnswers(formData: SubmitAnswersInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: instance } = await supabase
    .from('exercise_instances')
    .select(`
      id,
      expected_answer,
      completed
    `)
    .eq('id', formData.instance_id)
    .eq('student_id', user.id)
    .single();

  if (!instance) {
    return { error: 'Instance non trouvée' };
  }

  if (instance.completed) {
    return { error: 'Exercice déjà complété' };
  }

  // Parse expected answers from JSONB (with type safety)
  const rawExpectedAnswers = instance.expected_answer;
  const expectedAnswers: ExpectedAnswer[] = Array.isArray(rawExpectedAnswers) ? rawExpectedAnswers : [];

  if (expectedAnswers.length === 0) {
    return { error: 'Aucune réponse attendue configurée pour cet exercice' };
  }

  const result = checkMultipleAnswers(formData.answers, expectedAnswers);

  // Calculate average deviation for backwards compatibility
  const resultsArray = Array.isArray(result.results) ? result.results : [];
  const avgDeviation = resultsArray.length > 0
    ? resultsArray.reduce((sum, r) => sum + r.deviation, 0) / resultsArray.length
    : 0;

  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .insert({
      instance_id: formData.instance_id,
      student_id: user.id,
      given_answer: formData.answers,
      is_correct: result.allCorrect,
      deviation_percent: avgDeviation,
      answers_detail: result.results,
    })
    .select()
    .single();

  if (attemptError) {
    return { error: attemptError.message };
  }

  if (result.allCorrect) {
    await supabase
      .from('exercise_instances')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        final_answer: formData.answers,
      })
      .eq('id', formData.instance_id);
  }

  revalidatePath(`/etudiant/exercice/${formData.instance_id}`);

  return {
    data: {
      id: attempt.id,
      all_correct: result.allCorrect,
      correct_count: result.correctCount,
      total_count: result.totalCount,
      results: result.results,
      message: result.allCorrect
        ? 'Toutes les réponses sont correctes !'
        : `${result.correctCount}/${result.totalCount} réponses correctes`,
    },
  };
}

export async function getAttempts(instanceId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('attempts')
    .select('id, given_answer, is_correct, deviation_percent, answers_detail, created_at')
    .eq('instance_id', instanceId)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getExerciseAttempts(exerciseId: string) {
  const supabase = await createClient();

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

  const { data, error } = await supabase
    .from('attempts')
    .select(`
      id,
      given_answer,
      is_correct,
      deviation_percent,
      created_at,
      exercise_instances!inner (
        exercise_id,
        profiles (
          nom,
          numero_etudiant
        )
      )
    `)
    .eq('exercise_instances.exercise_id', exerciseId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

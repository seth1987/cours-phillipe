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

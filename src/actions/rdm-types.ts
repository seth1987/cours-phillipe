'use server';

import { createClient } from '@/lib/supabase/server';

export interface RdmType {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  formulas: Array<{ name: string; latex: string; description: string }>;
  variables: Array<{ symbol: string; name: string; unit: string }>;
  schema_svg: string | null;
}

export async function getRdmTypes(): Promise<{ data?: RdmType[]; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('rdm_types')
    .select('id, name, slug, description, formulas, variables, schema_svg')
    .order('name');

  if (error) {
    return { error: error.message };
  }

  return { data: data as RdmType[] };
}

export async function getRdmTypeBySlug(slug: string): Promise<{ data?: RdmType; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('rdm_types')
    .select('id, name, slug, description, formulas, variables, schema_svg')
    .eq('slug', slug)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as RdmType };
}

export async function getRdmTypeById(id: string): Promise<{ data?: RdmType; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('rdm_types')
    .select('id, name, slug, description, formulas, variables, schema_svg')
    .eq('id', id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as RdmType };
}

'use server';

import { generateExerciseWithAI, GenerateExerciseInput } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// VERSION TRACKING - Server Action
// ============================================================
const ACTION_VERSION = 'v3.0-action-' + Date.now();
console.log('[GEMINI-ACTION] ====================================');
console.log('[GEMINI-ACTION] Server Action loaded - ' + ACTION_VERSION);
console.log('[GEMINI-ACTION] Running on:', typeof window === 'undefined' ? 'SERVER' : 'CLIENT');
console.log('[GEMINI-ACTION] ====================================');

interface GenerateExerciseWithSchemaInput extends Omit<GenerateExerciseInput, 'schemaSvg'> {
  typeSlug?: string;
}

export async function generateExercise(input: GenerateExerciseWithSchemaInput) {
  console.log('[GEMINI-ACTION][' + ACTION_VERSION + '] === generateExercise() called ===');
  console.log('[GEMINI-ACTION] Input typeSlug:', input.typeSlug);
  console.log('[GEMINI-ACTION] Input typeName:', input.typeName);
  console.log('[GEMINI-ACTION] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
  console.log('[GEMINI-ACTION] GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);

  try {
    let schemaSvg: string | undefined;

    if (input.typeSlug) {
      console.log('[GEMINI-ACTION] Fetching schema_svg from database...');
      const supabase = await createClient();

      const { data: typeData, error: dbError } = await supabase
        .from('rdm_types')
        .select('schema_svg')
        .eq('slug', input.typeSlug)
        .single();

      if (dbError) {
        console.error('[GEMINI-ACTION] Database error:', dbError);
      }

      if (typeData?.schema_svg) {
        schemaSvg = typeData.schema_svg;
        console.log('[GEMINI-ACTION] Got schema_svg, length:', schemaSvg?.length || 0);
      } else {
        console.log('[GEMINI-ACTION] No schema_svg found for slug:', input.typeSlug);
      }
    }

    console.log('[GEMINI-ACTION] Calling generateExerciseWithAI...');
    const result = await generateExerciseWithAI({
      ...input,
      schemaSvg,
    });
    console.log('[GEMINI-ACTION] Success! Got result');

    return { data: result };
  } catch (error) {
    console.error('[GEMINI-ACTION] ERROR:', error);
    console.error('[GEMINI-ACTION] Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('[GEMINI-ACTION] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return { error: error instanceof Error ? error.message : 'Erreur de génération' };
  }
}

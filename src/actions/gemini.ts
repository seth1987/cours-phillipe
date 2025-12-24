'use server';

import { generateExerciseWithAI, GenerateExerciseInput } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

interface GenerateExerciseWithSchemaInput extends Omit<GenerateExerciseInput, 'schemaSvg'> {
  typeSlug?: string;
}

export async function generateExercise(input: GenerateExerciseWithSchemaInput) {
  try {
    let schemaSvg: string | undefined;

    if (input.typeSlug) {
      const supabase = await createClient();

      const { data: typeData } = await supabase
        .from('rdm_types')
        .select('schema_svg')
        .eq('slug', input.typeSlug)
        .single();

      if (typeData?.schema_svg) {
        schemaSvg = typeData.schema_svg;
      }
    }

    const result = await generateExerciseWithAI({
      ...input,
      schemaSvg,
    });

    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erreur de génération' };
  }
}

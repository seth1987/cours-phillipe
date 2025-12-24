import { z } from 'zod';

export const rangeConfigSchema = z.object({
  min: z.number(),
  max: z.number(),
  mode: z.enum(['libre', 'palier']),
  step: z.number().optional(),
  decimals: z.number().min(0).max(6).optional(),
});

export const createExerciseSchema = z.object({
  title: z.string().min(3).max(200),
  rdm_type_slug: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  statement_template: z.string().min(10, "L'énoncé doit contenir au moins 10 caractères").max(5000),
  formulas: z.array(z.object({
    name: z.string(),
    formula: z.string(),
    unit: z.string(),
  })),
  variable_ranges: z.record(z.string(), z.object({
    min: z.number(),
    max: z.number(),
    step: z.number().optional(),
  })),
  tolerance_percent: z.number().min(0.1).max(20).default(5),
  image_url: z.string().url().optional(),
  expected_answers: z.array(z.object({
    name: z.string(),
    formula: z.string(),
    unit: z.string(),
    tolerance: z.number().min(0).max(100),
  })).optional(),
  solution: z.string().max(10000).optional(),
});

export const updateExerciseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(200).optional(),
  statement_template: z.string().min(10).max(5000).optional(),
  formulas: z.array(z.object({
    name: z.string(),
    formula: z.string(),
    unit: z.string(),
  })).optional(),
  variable_ranges: z.record(z.string(), z.object({
    min: z.number(),
    max: z.number(),
    step: z.number().optional(),
  })).optional(),
  tolerance_percent: z.number().min(0.1).max(20).optional(),
});

export const publishExerciseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(200),
  deadline: z.string().datetime().optional().nullable(),
  showCorrection: z.boolean().default(false),
});

export const createStudentSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  password: z.string().min(8),
});

export const submitAnswerSchema = z.object({
  instanceId: z.string().uuid(),
  answer: z.number().finite(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

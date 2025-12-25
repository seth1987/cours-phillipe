-- ============================================================
-- DB VALIDATION QUERIES - Générateur d'Exercices RDM
-- Date: 2025-12-25
-- Objectif: Vérifier l'intégrité du schéma et détecter anomalies
-- ============================================================

-- ============================================================
-- 1. VÉRIFICATION DES COLONNES (exercises)
-- ============================================================

-- Liste toutes les colonnes de la table 'exercises'
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'exercises'
ORDER BY ordinal_position;

-- Résultat attendu: PAS de colonnes 'titre', 'enonce', 'statut', 'plages', 'type_id'

-- ============================================================
-- 2. VÉRIFICATION DES CONTRAINTES CHECK
-- ============================================================

-- Contrainte 'difficulty'
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'exercises'
  AND con.conname LIKE '%difficulty%';

-- Résultat attendu: CHECK (difficulty IN ('easy', 'medium', 'hard'))

-- Contrainte 'status'
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'exercises'
  AND con.conname LIKE '%status%';

-- Résultat attendu: CHECK (status IN ('draft', 'validated', 'published', 'archived'))

-- ============================================================
-- 3. VÉRIFICATION DES INDEX
-- ============================================================

-- Liste tous les index de la table 'exercises'
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'exercises';

-- Résultat attendu:
-- - idx_exercises_prof_id
-- - idx_exercises_status (PAS idx_exercises_statut)
-- - idx_exercises_rdm_type

-- ============================================================
-- 4. VÉRIFICATION DES CLÉS ÉTRANGÈRES
-- ============================================================

-- Liste toutes les FK de 'exercises'
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'exercises';

-- Résultat attendu:
-- - prof_id → profiles(id) ON DELETE CASCADE
-- - rdm_type_id → rdm_types(id) ON DELETE SET NULL

-- ============================================================
-- 5. TEST D'INSERTION (DOIT ÉCHOUER avec colonnes françaises)
-- ============================================================

-- Test 1: Insertion avec colonnes françaises (DEVRAIT ÉCHOUER)
-- NE PAS EXÉCUTER EN PRODUCTION, JUSTE POUR DIAGNOSTIC
/*
INSERT INTO exercises (
  prof_id,
  rdm_type_id,
  titre,         -- ❌ Colonne inexistante
  enonce,        -- ❌ Colonne inexistante
  statut         -- ❌ Colonne inexistante
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'Test',
  'Énoncé test',
  'brouillon'
);
-- Erreur attendue: column "titre" of relation "exercises" does not exist
*/

-- Test 2: Insertion avec colonnes anglaises (DEVRAIT RÉUSSIR)
/*
INSERT INTO exercises (
  prof_id,
  rdm_type_id,
  title,
  statement_template,
  formulas,
  variable_ranges,
  difficulty,
  status
) VALUES (
  (SELECT id FROM profiles WHERE role = 'professeur' LIMIT 1),
  (SELECT id FROM rdm_types LIMIT 1),
  'Test Exercise',
  'Calculate stress with F={F} N and S={S} m²',
  '[{"name":"sigma","formula":"F/S","unit":"Pa"}]'::jsonb,
  '{"F":{"min":100,"max":1000},"S":{"min":0.01,"max":0.1}}'::jsonb,
  'medium',
  'draft'
);
-- Devrait réussir sans erreur
-- DELETE FROM exercises WHERE title = 'Test Exercise'; -- Nettoyer après test
*/

-- ============================================================
-- 6. VÉRIFICATION DES DONNÉES EXISTANTES
-- ============================================================

-- Compter les exercices par statut
SELECT
  status,
  COUNT(*) AS count
FROM exercises
GROUP BY status
ORDER BY status;

-- Résultat attendu: Seulement 'draft', 'validated', 'published', 'archived'
-- Si des valeurs françaises ('brouillon', etc.) apparaissent, il y a un problème

-- Vérifier les exercices sans titre (NULL)
SELECT
  id,
  title,
  statement_template,
  status,
  created_at
FROM exercises
WHERE title IS NULL OR statement_template IS NULL;

-- Résultat attendu: 0 lignes (contrainte NOT NULL)

-- Vérifier les types RDM orphelins
SELECT
  id,
  title,
  rdm_type_id
FROM exercises
WHERE rdm_type_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rdm_types WHERE id = exercises.rdm_type_id
  );

-- Résultat attendu: 0 lignes (FK doit être valide)

-- ============================================================
-- 7. VÉRIFICATION DES TRIGGERS
-- ============================================================

-- Liste tous les triggers sur 'exercises'
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'exercises'
  AND trigger_schema = 'public';

-- Résultat attendu:
-- - update_exercises_updated_at (BEFORE UPDATE)

-- Tester le trigger updated_at
/*
UPDATE exercises
SET title = title || ''
WHERE id = (SELECT id FROM exercises LIMIT 1);

SELECT id, title, updated_at
FROM exercises
ORDER BY updated_at DESC
LIMIT 1;
-- Vérifier que updated_at a changé
*/

-- ============================================================
-- 8. VÉRIFICATION RLS (ROW LEVEL SECURITY)
-- ============================================================

-- Vérifier que RLS est activé
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'exercises';

-- Résultat attendu: rowsecurity = true

-- Liste toutes les policies sur 'exercises'
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'exercises';

-- Résultat attendu:
-- - Profs can view own exercises (SELECT)
-- - Profs can insert exercises (INSERT)
-- - Profs can update own exercises (UPDATE)
-- - Profs can delete own exercises (DELETE)
-- - Students can view published exercises (SELECT)

-- ============================================================
-- 9. VÉRIFICATION JSONB (formulas, variable_ranges, etc.)
-- ============================================================

-- Vérifier la structure des formulas
SELECT
  id,
  title,
  formulas,
  jsonb_array_length(formulas) AS formula_count
FROM exercises
WHERE jsonb_typeof(formulas) != 'array';

-- Résultat attendu: 0 lignes (formulas doit être un tableau)

-- Vérifier la structure des variable_ranges
SELECT
  id,
  title,
  variable_ranges,
  jsonb_object_keys(variable_ranges) AS variable_name
FROM exercises
WHERE jsonb_typeof(variable_ranges) != 'object';

-- Résultat attendu: 0 lignes (variable_ranges doit être un objet)

-- Vérifier les expected_answers (migration 004)
SELECT
  id,
  title,
  expected_answers,
  jsonb_array_length(expected_answers) AS answer_count
FROM exercises
WHERE expected_answers IS NOT NULL
  AND jsonb_typeof(expected_answers) != 'array';

-- Résultat attendu: 0 lignes (expected_answers doit être un tableau)

-- ============================================================
-- 10. VÉRIFICATION EXERCISE_INSTANCES (migration JSONB)
-- ============================================================

-- Vérifier que expected_answer est JSONB (pas DECIMAL)
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'exercise_instances'
  AND column_name = 'expected_answer';

-- Résultat attendu: data_type = 'jsonb'

-- Vérifier la structure des expected_answer
SELECT
  id,
  expected_answer,
  jsonb_array_length(expected_answer) AS answer_count
FROM exercise_instances
WHERE jsonb_typeof(expected_answer) != 'array'
LIMIT 10;

-- Résultat attendu: 0 lignes (expected_answer doit être un tableau)

-- ============================================================
-- 11. STATISTIQUES GÉNÉRALES
-- ============================================================

-- Résumé par table
SELECT
  'exercises' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(DISTINCT prof_id) AS unique_profs,
  COUNT(DISTINCT rdm_type_id) AS unique_types
FROM exercises
UNION ALL
SELECT
  'exercise_instances',
  COUNT(*),
  NULL,
  COUNT(DISTINCT exercise_id)
FROM exercise_instances
UNION ALL
SELECT
  'attempts',
  COUNT(*),
  NULL,
  COUNT(DISTINCT instance_id)
FROM attempts
UNION ALL
SELECT
  'rdm_types',
  COUNT(*),
  NULL,
  NULL
FROM rdm_types
UNION ALL
SELECT
  'profiles',
  COUNT(*),
  SUM(CASE WHEN role = 'professeur' THEN 1 ELSE 0 END),
  SUM(CASE WHEN role = 'etudiant' THEN 1 ELSE 0 END)
FROM profiles;

-- ============================================================
-- 12. VALIDATION FINALE (Checklist)
-- ============================================================

-- Checklist des colonnes ABSENTES (doit retourner 0 pour chaque)
SELECT
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'titre') AS has_titre,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'enonce') AS has_enonce,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'statut') AS has_statut,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'plages') AS has_plages,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'type_id') AS has_type_id;

-- Résultat attendu: Tous les compteurs à 0

-- Checklist des colonnes PRÉSENTES (doit retourner 1 pour chaque)
SELECT
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'title') AS has_title,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'statement_template') AS has_statement_template,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'status') AS has_status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'variable_ranges') AS has_variable_ranges,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'rdm_type_id') AS has_rdm_type_id;

-- Résultat attendu: Tous les compteurs à 1

-- ============================================================
-- FIN DU SCRIPT DE VALIDATION
-- ============================================================

-- Notes d'utilisation:
-- 1. Exécuter ce script dans Supabase SQL Editor
-- 2. Vérifier chaque résultat correspond aux "Résultat attendu"
-- 3. Si anomalie détectée, consulter docs/db-schema-analysis-report.md
-- 4. Les requêtes commentées (/* */) sont des tests destructifs
--    à exécuter UNIQUEMENT en environnement de développement

-- Auteur: DB Schema Analyzer Agent
-- Version: 1.0
-- Date: 2025-12-25

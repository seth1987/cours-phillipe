# Tâche 03 - Création du Schéma de Base de Données

## Contexte
Créer toutes les tables PostgreSQL définies dans l'architecture : profiles, types, templates, exercises, exercise_instances, attempts.

## User Stories liées
- Toutes (fondation données)

## Durée estimée
**2-3 heures**

## Requirements

### Checklist
- [ ] Créer la table `profiles` (extension auth.users)
- [ ] Créer la table `types` (squelettes mathématiques)
- [ ] Créer la table `templates` (modèles sauvegardés)
- [ ] Créer la table `exercises` (exercices créés)
- [ ] Créer la table `exercise_instances` (variantes par étudiant)
- [ ] Créer la table `attempts` (tentatives de réponse)
- [ ] Créer les index de performance
- [ ] Créer les triggers (updated_at)
- [ ] Régénérer les types TypeScript

## Acceptance Criteria

1. ✅ Toutes les tables sont créées dans Supabase
2. ✅ Les relations FK sont correctes
3. ✅ Les contraintes CHECK fonctionnent (rôles, statuts)
4. ✅ Les index sont créés
5. ✅ Les types TypeScript sont à jour

## Technical Notes

### Ordre de création (dépendances FK)
1. `profiles` (référence auth.users)
2. `types` (référence profiles)
3. `templates` (référence types, profiles)
4. `exercises` (référence types, templates, profiles)
5. `exercise_instances` (référence exercises, profiles)
6. `attempts` (référence exercise_instances)

### Contraintes importantes
- `profiles.role` : CHECK ('prof', 'student')
- `exercises.status` : CHECK ('draft', 'validated', 'published', 'archived')
- `exercise_instances` : UNIQUE(exercise_id, student_id)

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/migrations/001_initial_schema.sql` | Create | Tables + index + triggers |
| `src/types/database.ts` | Regenerate | Types générés Supabase |

## Dependencies (blockers)
- ✅ Tâche 02 - Supabase Setup

## SQL Script

```sql
-- Voir spec/ARCHI.md section "Scripts SQL" pour le script complet
-- 001_initial_schema.sql

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('prof', 'student')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table types
CREATE TABLE types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('flexion', 'torsion', 'traction', 'thermique', 'pfs')),
    description TEXT,
    formulas JSONB NOT NULL,
    variables JSONB NOT NULL,
    result_unit TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id),
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table templates
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_id UUID NOT NULL REFERENCES types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    statement TEXT NOT NULL,
    ranges JSONB NOT NULL,
    tolerance DECIMAL(5,2) DEFAULT 2.0,
    image_url TEXT,
    solution TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table exercises
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_id UUID NOT NULL REFERENCES types(id),
    template_id UUID REFERENCES templates(id),
    title TEXT NOT NULL,
    statement TEXT NOT NULL,
    ranges JSONB NOT NULL,
    tolerance DECIMAL(5,2) DEFAULT 2.0,
    image_url TEXT,
    solution TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'published', 'archived')),
    deadline TIMESTAMPTZ,
    show_correction BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ
);

-- Table exercise_instances
CREATE TABLE exercise_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id),
    values JSONB NOT NULL,
    expected_answer DECIMAL(20,6) NOT NULL,
    statement_filled TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exercise_id, student_id)
);

-- Table attempts
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES exercise_instances(id) ON DELETE CASCADE,
    answer DECIMAL(20,6) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    deviation DECIMAL(10,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_exercises_status ON exercises(status);
CREATE INDEX idx_exercises_created_by ON exercises(created_by);
CREATE INDEX idx_instances_exercise ON exercise_instances(exercise_id);
CREATE INDEX idx_instances_student ON exercise_instances(student_id);
CREATE INDEX idx_attempts_instance ON attempts(instance_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_created_by ON profiles(created_by);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Commands

```bash
# Exécuter dans SQL Editor de Supabase Dashboard
# Ou via CLI:
npx supabase db push

# Régénérer types
npx supabase gen types typescript --project-id <id> > src/types/database.ts
```

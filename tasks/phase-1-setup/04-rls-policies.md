# Tâche 04 - Configuration Row Level Security (RLS)

## Contexte
Sécuriser l'accès aux données avec les policies RLS Supabase. Chaque rôle (prof/student) doit avoir accès uniquement aux données autorisées.

## User Stories liées
- US-014 : Authentification (sécurité données)
- Toutes (protection données)

## Durée estimée
**1-2 heures**

## Requirements

### Checklist
- [ ] Activer RLS sur toutes les tables
- [ ] Créer les fonctions helper (get_user_role, get_student_prof)
- [ ] Créer les policies pour `profiles`
- [ ] Créer les policies pour `types`
- [ ] Créer les policies pour `templates`
- [ ] Créer les policies pour `exercises`
- [ ] Créer les policies pour `exercise_instances`
- [ ] Créer les policies pour `attempts`
- [ ] Tester les policies avec différents rôles

## Acceptance Criteria

1. ✅ Un prof ne voit que ses propres exercices
2. ✅ Un étudiant ne voit que les exercices publiés de son prof
3. ✅ Un étudiant ne voit que sa propre variante
4. ✅ Les types système sont visibles par tous
5. ✅ Un utilisateur non connecté n'a accès à rien

## Technical Notes

### Logique des policies

| Table | Prof | Étudiant |
|-------|------|----------|
| profiles | Voir lui-même + ses étudiants | Voir lui-même |
| types | Tous (système) + ses custom | Tous (système) |
| templates | Ses templates | Aucun |
| exercises | Ses exercices | Publiés de son prof |
| instances | Toutes de ses exercices | Sa variante |
| attempts | Toutes de ses exercices | Ses tentatives |

### Fonctions helper
- `get_user_role()` : Retourne le rôle de l'utilisateur connecté
- `get_student_prof()` : Retourne l'ID du prof qui a créé l'étudiant

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/migrations/002_rls_policies.sql` | Create | Policies RLS |

## Dependencies (blockers)
- ✅ Tâche 03 - Database Schema

## SQL Script

```sql
-- 002_rls_policies.sql

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE types ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Fonctions helper
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_student_prof()
RETURNS UUID AS $$
    SELECT created_by FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Prof can view own students" ON profiles
    FOR SELECT USING (
        get_user_role() = 'prof' AND created_by = auth.uid()
    );

CREATE POLICY "Prof can create students" ON profiles
    FOR INSERT WITH CHECK (
        get_user_role() = 'prof' AND role = 'student'
    );

CREATE POLICY "Prof can delete students" ON profiles
    FOR DELETE USING (
        get_user_role() = 'prof' AND created_by = auth.uid()
    );

-- TYPES
CREATE POLICY "Anyone can view system types" ON types
    FOR SELECT USING (is_system = TRUE);

CREATE POLICY "Prof can view own custom types" ON types
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Prof can create types" ON types
    FOR INSERT WITH CHECK (get_user_role() = 'prof');

CREATE POLICY "Prof can update own types" ON types
    FOR UPDATE USING (created_by = auth.uid() AND is_system = FALSE);

CREATE POLICY "Prof can delete own types" ON types
    FOR DELETE USING (created_by = auth.uid() AND is_system = FALSE);

-- TEMPLATES
CREATE POLICY "Prof can view own templates" ON templates
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Prof can create templates" ON templates
    FOR INSERT WITH CHECK (get_user_role() = 'prof');

CREATE POLICY "Prof can update own templates" ON templates
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Prof can delete own templates" ON templates
    FOR DELETE USING (created_by = auth.uid());

-- EXERCISES
CREATE POLICY "Prof can view own exercises" ON exercises
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Student can view published exercises" ON exercises
    FOR SELECT USING (
        get_user_role() = 'student' AND
        status IN ('published', 'archived') AND
        created_by = get_student_prof()
    );

CREATE POLICY "Prof can create exercises" ON exercises
    FOR INSERT WITH CHECK (get_user_role() = 'prof');

CREATE POLICY "Prof can update own exercises" ON exercises
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Prof can delete own draft exercises" ON exercises
    FOR DELETE USING (created_by = auth.uid() AND status = 'draft');

-- EXERCISE_INSTANCES
CREATE POLICY "Student can view own instance" ON exercise_instances
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Prof can view all instances of own exercises" ON exercise_instances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exercises e
            WHERE e.id = exercise_id AND e.created_by = auth.uid()
        )
    );

CREATE POLICY "System can create instances" ON exercise_instances
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM exercises e
            WHERE e.id = exercise_id AND e.created_by = auth.uid()
        )
    );

-- ATTEMPTS
CREATE POLICY "Student can create attempts on own instance" ON attempts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM exercise_instances ei
            WHERE ei.id = instance_id AND ei.student_id = auth.uid()
        )
    );

CREATE POLICY "Student can view own attempts" ON attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exercise_instances ei
            WHERE ei.id = instance_id AND ei.student_id = auth.uid()
        )
    );

CREATE POLICY "Prof can view all attempts of own exercises" ON attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exercise_instances ei
            JOIN exercises e ON e.id = ei.exercise_id
            WHERE ei.id = instance_id AND e.created_by = auth.uid()
        )
    );
```

## Test Scenarios

1. **Connexion Prof** : Peut voir ses exercices, pas ceux des autres
2. **Connexion Étudiant** : Peut voir exercices publiés, pas brouillons
3. **Étudiant A vs B** : Chacun ne voit que sa variante
4. **Non connecté** : Aucun accès aux données

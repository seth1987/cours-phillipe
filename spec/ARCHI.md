# Architecture Technique - RDM-Exercices

## 1. Vue d'ensemble de l'Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              UTILISATEURS                                  │
│                                                                            │
│     ┌─────────────┐                              ┌─────────────┐          │
│     │  Professeur │                              │  Étudiants  │          │
│     │  (1 user)   │                              │  (~30 users)│          │
│     └──────┬──────┘                              └──────┬──────┘          │
│            │                                            │                  │
└────────────┼────────────────────────────────────────────┼──────────────────┘
             │                                            │
             ▼                                            ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Vercel)                                │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                     Next.js 14 (App Router)                          │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │ │
│  │  │   Pages    │  │ Components │  │   Hooks    │  │   Utils    │     │ │
│  │  │  /prof/*   │  │  ui/       │  │  useAuth   │  │  formulas  │     │ │
│  │  │  /student/*│  │  forms/    │  │  useExerc. │  │  calculate │     │ │
│  │  │  /auth/*   │  │  exercise/ │  │  useStats  │  │  generate  │     │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│                           Server Actions                                   │
│                                    │                                       │
└────────────────────────────────────┼───────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│      SUPABASE        │  │  SUPABASE AUTH   │  │  GOOGLE GEMINI   │
│     (PostgreSQL)     │  │                  │  │      API         │
│                      │  │  - Login/Logout  │  │                  │
│  - users             │  │  - Sessions      │  │  - Génération    │
│  - types             │  │  - Rôles (RLS)   │  │    énoncés       │
│  - templates         │  │                  │  │  - Résolutions   │
│  - exercises         │  └──────────────────┘  │    détaillées    │
│  - instances         │                        │                  │
│  - attempts          │  ┌──────────────────┐  └──────────────────┘
│                      │  │ SUPABASE STORAGE │
│                      │  │                  │
│                      │  │  - Images        │
│                      │  │    exercices     │
└──────────────────────┘  └──────────────────┘
```

---

## 2. Stack Technique

| Couche | Technologie | Version | Justification |
|--------|-------------|---------|---------------|
| **Framework** | Next.js | 14.x | App Router, Server Components, Server Actions, SSR/SSG |
| **Runtime** | React | 18.x | Composants réactifs, hooks, Suspense |
| **Langage** | TypeScript | 5.x | Typage strict, meilleure DX, moins de bugs |
| **Styling** | Tailwind CSS | 3.x | Utility-first, rapide, responsive natif |
| **UI Components** | shadcn/ui | latest | Composants accessibles, personnalisables, pas de dépendance |
| **Backend** | Supabase | latest | PostgreSQL managé, Auth intégré, RLS, Storage, gratuit |
| **Base de données** | PostgreSQL | 15.x | Via Supabase, relationnel, JSONB pour données flexibles |
| **Auth** | Supabase Auth | latest | Email/password, sessions, RLS intégré |
| **IA** | Google Gemini | 1.5 Flash | Gratuit 1500 req/jour, rapide, bon pour génération texte |
| **Hosting** | Vercel | - | Gratuit, CI/CD auto avec GitHub, edge functions |
| **Tests** | Vitest + Playwright | latest | Tests unitaires rapides + E2E |
| **Formules Math** | KaTeX | 0.16.x | Rendu LaTeX côté client, léger |

---

## 3. Structure du Projet

```
rdm-exercices/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Groupe routes auth (layout partagé)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (prof)/                   # Groupe routes professeur
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Vue d'ensemble prof
│   │   │   ├── exercices/
│   │   │   │   ├── page.tsx          # Liste exercices
│   │   │   │   ├── nouveau/
│   │   │   │   │   └── page.tsx      # Création exercice
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Détail/édition exercice
│   │   │   │       └── stats/
│   │   │   │           └── page.tsx  # Stats de l'exercice
│   │   │   ├── types/
│   │   │   │   └── page.tsx          # Bibliothèque types
│   │   │   ├── modeles/
│   │   │   │   └── page.tsx          # Bibliothèque modèles
│   │   │   ├── etudiants/
│   │   │   │   └── page.tsx          # Gestion étudiants
│   │   │   ├── statistiques/
│   │   │   │   └── page.tsx          # Stats globales
│   │   │   └── layout.tsx            # Layout prof (sidebar, header)
│   │   │
│   │   ├── (student)/                # Groupe routes étudiant
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Vue d'ensemble étudiant
│   │   │   ├── exercices/
│   │   │   │   ├── page.tsx          # Liste exercices disponibles
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Résolution exercice
│   │   │   ├── historique/
│   │   │   │   └── page.tsx          # Historique réponses
│   │   │   └── layout.tsx            # Layout étudiant
│   │   │
│   │   ├── api/                      # API Routes (si nécessaire)
│   │   │   └── gemini/
│   │   │       └── generate/
│   │   │           └── route.ts      # Appel Gemini API
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page (redirect)
│   │   └── globals.css               # Styles globaux Tailwind
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   │
│   │   ├── forms/                    # Formulaires métier
│   │   │   ├── exercise-form.tsx     # Formulaire création exercice
│   │   │   ├── variable-range-form.tsx
│   │   │   ├── student-form.tsx
│   │   │   └── answer-form.tsx       # Formulaire réponse étudiant
│   │   │
│   │   ├── exercise/                 # Composants exercice
│   │   │   ├── type-selector.tsx     # Sélecteur de type
│   │   │   ├── exercise-card.tsx     # Card exercice (liste)
│   │   │   ├── exercise-preview.tsx  # Prévisualisation
│   │   │   ├── exercise-editor.tsx   # Éditeur énoncé
│   │   │   ├── formula-display.tsx   # Affichage formules LaTeX
│   │   │   ├── variable-config.tsx   # Config plages variables
│   │   │   └── solution-display.tsx  # Affichage résolution
│   │   │
│   │   ├── stats/                    # Composants statistiques
│   │   │   ├── stats-card.tsx
│   │   │   ├── progress-chart.tsx
│   │   │   └── student-table.tsx
│   │   │
│   │   └── layout/                   # Composants layout
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       ├── nav-prof.tsx
│   │       └── nav-student.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Client Supabase (browser)
│   │   │   ├── server.ts             # Client Supabase (server)
│   │   │   ├── middleware.ts         # Auth middleware
│   │   │   └── types.ts              # Types générés Supabase
│   │   │
│   │   ├── gemini/
│   │   │   ├── client.ts             # Client Gemini API
│   │   │   ├── prompts.ts            # Templates de prompts
│   │   │   └── parser.ts             # Parser réponses IA
│   │   │
│   │   ├── formulas/
│   │   │   ├── calculator.ts         # Évaluation formules
│   │   │   ├── parser.ts             # Parser formules
│   │   │   └── types-library.ts      # Bibliothèque types RDM
│   │   │
│   │   └── utils/
│   │       ├── variants.ts           # Génération variantes
│   │       ├── tolerance.ts          # Vérification tolérance
│   │       └── format.ts             # Formatage nombres/dates
│   │
│   ├── hooks/
│   │   ├── use-auth.ts               # Hook authentification
│   │   ├── use-exercises.ts          # Hook exercices
│   │   ├── use-types.ts              # Hook types
│   │   └── use-stats.ts              # Hook statistiques
│   │
│   ├── types/
│   │   ├── database.ts               # Types Supabase (générés)
│   │   ├── exercise.ts               # Types exercices
│   │   ├── formula.ts                # Types formules
│   │   └── index.ts                  # Export centralisé
│   │
│   └── actions/                      # Server Actions
│       ├── auth.ts                   # Actions auth
│       ├── exercises.ts              # Actions exercices
│       ├── types.ts                  # Actions types
│       ├── instances.ts              # Actions variantes
│       ├── attempts.ts               # Actions tentatives
│       └── students.ts               # Actions étudiants
│
├── supabase/
│   ├── migrations/                   # Migrations SQL
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_seed_types.sql
│   └── seed.sql                      # Données initiales (types RDM)
│
├── tests/
│   ├── unit/                         # Tests unitaires (Vitest)
│   │   ├── formulas.test.ts
│   │   ├── variants.test.ts
│   │   └── tolerance.test.ts
│   └── e2e/                          # Tests E2E (Playwright)
│       ├── auth.spec.ts
│       ├── prof-workflow.spec.ts
│       └── student-workflow.spec.ts
│
├── public/
│   └── images/                       # Assets statiques
│
├── .env.local                        # Variables d'environnement (local)
├── .env.example                      # Template variables
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## 4. Schéma de Base de Données

### Diagramme ERD

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE AUTH                              │
│                           (auth.users - géré)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ 1:1
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              profiles                                    │
│─────────────────────────────────────────────────────────────────────────│
│ id          UUID PK FK(auth.users)                                      │
│ email       TEXT NOT NULL                                               │
│ full_name   TEXT                                                        │
│ role        TEXT CHECK (prof, student) NOT NULL                         │
│ created_by  UUID FK(profiles) -- NULL pour prof, prof_id pour étudiants │
│ created_at  TIMESTAMPTZ DEFAULT NOW()                                   │
│ updated_at  TIMESTAMPTZ DEFAULT NOW()                                   │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │
         │                    │ 1:N (prof crée étudiants)
         │                    │
         │    ┌───────────────┘
         │    │
         ▼    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              types                                       │
│─────────────────────────────────────────────────────────────────────────│
│ id          UUID PK DEFAULT gen_random_uuid()                           │
│ name        TEXT NOT NULL                                               │
│ category    TEXT NOT NULL (flexion, torsion, traction, thermique, pfs)  │
│ description TEXT                                                        │
│ formulas    JSONB NOT NULL  -- [{name, latex, code, description}]       │
│ variables   JSONB NOT NULL  -- [{symbol, name, unit, description}]      │
│ result_unit TEXT NOT NULL                                               │
│ created_by  UUID FK(profiles) -- NULL = système, sinon prof             │
│ is_system   BOOLEAN DEFAULT FALSE                                       │
│ created_at  TIMESTAMPTZ DEFAULT NOW()                                   │
└─────────────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              templates                                   │
│─────────────────────────────────────────────────────────────────────────│
│ id           UUID PK DEFAULT gen_random_uuid()                          │
│ type_id      UUID FK(types) NOT NULL                                    │
│ name         TEXT NOT NULL                                              │
│ statement    TEXT NOT NULL  -- Énoncé avec {variables}                  │
│ ranges       JSONB NOT NULL -- {var: {min, max, mode, step, decimals}}  │
│ tolerance    DECIMAL(5,2) DEFAULT 2.0                                   │
│ image_url    TEXT                                                       │
│ solution     TEXT  -- Résolution détaillée                              │
│ created_by   UUID FK(profiles) NOT NULL                                 │
│ usage_count  INTEGER DEFAULT 0                                          │
│ created_at   TIMESTAMPTZ DEFAULT NOW()                                  │
│ updated_at   TIMESTAMPTZ DEFAULT NOW()                                  │
└─────────────────────────────────────────────────────────────────────────┘
         │
         │ (optionnel, exercice peut être basé sur template)
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              exercises                                   │
│─────────────────────────────────────────────────────────────────────────│
│ id              UUID PK DEFAULT gen_random_uuid()                       │
│ type_id         UUID FK(types) NOT NULL                                 │
│ template_id     UUID FK(templates)  -- NULL si créé from scratch        │
│ title           TEXT NOT NULL                                           │
│ statement       TEXT NOT NULL  -- Énoncé avec {variables}               │
│ ranges          JSONB NOT NULL                                          │
│ tolerance       DECIMAL(5,2) DEFAULT 2.0                                │
│ image_url       TEXT                                                    │
│ solution        TEXT  -- Résolution détaillée générée par IA            │
│ status          TEXT CHECK (draft, validated, published, archived)      │
│ deadline        TIMESTAMPTZ                                             │
│ show_correction BOOLEAN DEFAULT FALSE                                   │
│ created_by      UUID FK(profiles) NOT NULL                              │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                               │
│ published_at    TIMESTAMPTZ                                             │
│ archived_at     TIMESTAMPTZ                                             │
└─────────────────────────────────────────────────────────────────────────┘
         │
         │ 1:N (1 exercice → N instances pour N étudiants)
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          exercise_instances                              │
│─────────────────────────────────────────────────────────────────────────│
│ id               UUID PK DEFAULT gen_random_uuid()                      │
│ exercise_id      UUID FK(exercises) NOT NULL                            │
│ student_id       UUID FK(profiles) NOT NULL                             │
│ values           JSONB NOT NULL  -- {L: 4.5, b: 15, h: 35, P: 25}       │
│ expected_answer  DECIMAL(20,6) NOT NULL                                 │
│ statement_filled TEXT NOT NULL  -- Énoncé avec valeurs injectées        │
│ created_at       TIMESTAMPTZ DEFAULT NOW()                              │
│ UNIQUE(exercise_id, student_id)                                         │
└─────────────────────────────────────────────────────────────────────────┘
         │
         │ 1:N (1 instance → N tentatives)
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              attempts                                    │
│─────────────────────────────────────────────────────────────────────────│
│ id            UUID PK DEFAULT gen_random_uuid()                         │
│ instance_id   UUID FK(exercise_instances) NOT NULL                      │
│ answer        DECIMAL(20,6) NOT NULL                                    │
│ is_correct    BOOLEAN NOT NULL                                          │
│ deviation     DECIMAL(10,4)  -- Écart en % avec réponse attendue        │
│ created_at    TIMESTAMPTZ DEFAULT NOW()                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Scripts SQL

```sql
-- 001_initial_schema.sql

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table profiles (extension de auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('prof', 'student')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table types (squelettes mathématiques)
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

-- Table templates (modèles sauvegardés)
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

-- Table exercise_instances (variantes par étudiant)
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

-- Table attempts (tentatives de réponse)
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES exercise_instances(id) ON DELETE CASCADE,
    answer DECIMAL(20,6) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    deviation DECIMAL(10,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_exercises_status ON exercises(status);
CREATE INDEX idx_exercises_created_by ON exercises(created_by);
CREATE INDEX idx_instances_exercise ON exercise_instances(exercise_id);
CREATE INDEX idx_instances_student ON exercise_instances(student_id);
CREATE INDEX idx_attempts_instance ON attempts(instance_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_created_by ON profiles(created_by);

-- Trigger pour updated_at
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

```sql
-- 002_rls_policies.sql

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE types ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour récupérer le rôle
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Fonction helper pour récupérer le prof de l'étudiant
CREATE OR REPLACE FUNCTION get_student_prof()
RETURNS UUID AS $$
    SELECT created_by FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES
-- Prof voit tous ses étudiants + lui-même
CREATE POLICY "Prof can view own students" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR
        (get_user_role() = 'prof' AND created_by = auth.uid())
    );

-- Prof peut créer des étudiants
CREATE POLICY "Prof can create students" ON profiles
    FOR INSERT WITH CHECK (
        get_user_role() = 'prof' AND role = 'student'
    );

-- TYPES
-- Tout le monde peut voir les types système
CREATE POLICY "Anyone can view system types" ON types
    FOR SELECT USING (is_system = TRUE OR created_by = auth.uid());

-- Prof peut créer ses propres types
CREATE POLICY "Prof can create types" ON types
    FOR INSERT WITH CHECK (get_user_role() = 'prof');

-- TEMPLATES
-- Prof voit ses templates
CREATE POLICY "Prof can view own templates" ON templates
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Prof can manage templates" ON templates
    FOR ALL USING (created_by = auth.uid());

-- EXERCISES
-- Prof voit ses exercices
CREATE POLICY "Prof can view own exercises" ON exercises
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Prof can manage exercises" ON exercises
    FOR ALL USING (created_by = auth.uid());

-- Étudiant voit exercices publiés de son prof
CREATE POLICY "Student can view published exercises" ON exercises
    FOR SELECT USING (
        get_user_role() = 'student' AND
        status IN ('published', 'archived') AND
        created_by = get_student_prof()
    );

-- EXERCISE_INSTANCES
-- Étudiant voit sa variante
CREATE POLICY "Student can view own instance" ON exercise_instances
    FOR SELECT USING (student_id = auth.uid());

-- Prof voit toutes les instances de ses exercices
CREATE POLICY "Prof can view all instances" ON exercise_instances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exercises e
            WHERE e.id = exercise_id AND e.created_by = auth.uid()
        )
    );

-- ATTEMPTS
-- Étudiant peut créer et voir ses tentatives
CREATE POLICY "Student can manage own attempts" ON attempts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM exercise_instances ei
            WHERE ei.id = instance_id AND ei.student_id = auth.uid()
        )
    );

-- Prof voit toutes les tentatives de ses exercices
CREATE POLICY "Prof can view all attempts" ON attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exercise_instances ei
            JOIN exercises e ON e.id = ei.exercise_id
            WHERE ei.id = instance_id AND e.created_by = auth.uid()
        )
    );
```

---

## 5. API Design (Server Actions)

Next.js 14 utilise les **Server Actions** au lieu d'API REST traditionnelles.

### Actions Authentification (`src/actions/auth.ts`)

| Action | Description | Paramètres | Retour |
|--------|-------------|------------|--------|
| `signIn` | Connexion utilisateur | `email, password` | `{ user, error }` |
| `signOut` | Déconnexion | - | `{ error }` |
| `signUp` | Inscription (prof uniquement) | `email, password, fullName` | `{ user, error }` |
| `createStudent` | Créer compte étudiant | `email, fullName, password` | `{ student, error }` |
| `getSession` | Récupérer session active | - | `{ session, user }` |

### Actions Exercices (`src/actions/exercises.ts`)

| Action | Description | Paramètres | Retour |
|--------|-------------|------------|--------|
| `createExercise` | Créer exercice (brouillon) | `typeId, statement, ranges, ...` | `{ exercise, error }` |
| `updateExercise` | Modifier exercice | `id, updates` | `{ exercise, error }` |
| `validateExercise` | Passer en validé | `id` | `{ exercise, error }` |
| `publishExercise` | Publier + générer variantes | `id, title, deadline?, ...` | `{ exercise, error }` |
| `archiveExercise` | Archiver exercice | `id` | `{ exercise, error }` |
| `deleteExercise` | Supprimer brouillon | `id` | `{ error }` |
| `getExercises` | Liste exercices (prof) | `status?` | `{ exercises, error }` |
| `getExercise` | Détail exercice | `id` | `{ exercise, error }` |
| `getStudentExercises` | Liste exercices (étudiant) | - | `{ exercises, error }` |

### Actions Types (`src/actions/types.ts`)

| Action | Description | Paramètres | Retour |
|--------|-------------|------------|--------|
| `getTypes` | Liste tous les types | `category?` | `{ types, error }` |
| `getType` | Détail d'un type | `id` | `{ type, error }` |
| `createType` | Créer type custom | `name, category, formulas, ...` | `{ type, error }` |

### Actions Variantes (`src/actions/instances.ts`)

| Action | Description | Paramètres | Retour |
|--------|-------------|------------|--------|
| `generateInstances` | Générer variantes pour tous étudiants | `exerciseId` | `{ instances, error }` |
| `getStudentInstance` | Récupérer variante étudiant | `exerciseId` | `{ instance, error }` |

### Actions Tentatives (`src/actions/attempts.ts`)

| Action | Description | Paramètres | Retour |
|--------|-------------|------------|--------|
| `submitAnswer` | Soumettre réponse | `instanceId, answer` | `{ attempt, isCorrect, error }` |
| `getAttempts` | Historique tentatives | `instanceId` | `{ attempts, error }` |

### Actions IA (`src/actions/ai.ts`)

| Action | Description | Paramètres | Retour |
|--------|-------------|------------|--------|
| `generateExercise` | Générer avec Gemini | `typeId, context?` | `{ statement, ranges, solution, error }` |
| `regenerateStatement` | Régénérer énoncé seul | `typeId, context?` | `{ statement, error }` |

---

## 6. Flux d'Authentification

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUX CONNEXION                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Utilisateur → /login                                            │
│          │                                                          │
│          ▼                                                          │
│  2. Formulaire email/password                                       │
│          │                                                          │
│          ▼                                                          │
│  3. Server Action: signIn(email, password)                          │
│          │                                                          │
│          ▼                                                          │
│  4. Supabase Auth: supabase.auth.signInWithPassword()               │
│          │                                                          │
│          ├── Succès ──► 5a. Récupérer profil (role)                │
│          │                     │                                    │
│          │                     ├── role = 'prof' ──► /prof/dashboard│
│          │                     │                                    │
│          │                     └── role = 'student' ──► /student/   │
│          │                                              dashboard   │
│          │                                                          │
│          └── Échec ──► 5b. Afficher erreur                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   CRÉATION COMPTE ÉTUDIANT                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Prof (connecté) → /prof/etudiants                               │
│          │                                                          │
│          ▼                                                          │
│  2. Formulaire: email, nom, mot de passe initial                    │
│          │                                                          │
│          ▼                                                          │
│  3. Server Action: createStudent(email, fullName, password)         │
│          │                                                          │
│          ▼                                                          │
│  4. Supabase Admin: auth.admin.createUser()                         │
│          │                                                          │
│          ▼                                                          │
│  5. Créer profil avec role='student', created_by=prof.id            │
│          │                                                          │
│          ▼                                                          │
│  6. Retourner credentials à afficher au prof                        │
│     (email envoyé à l'étudiant optionnel)                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Middleware de protection des routes

```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const { data: { session } } = await supabase.auth.getSession();

    // Routes protégées
    if (req.nextUrl.pathname.startsWith('/prof')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', req.url));
        }
        // Vérifier rôle prof
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profile?.role !== 'prof') {
            return NextResponse.redirect(new URL('/student/dashboard', req.url));
        }
    }

    if (req.nextUrl.pathname.startsWith('/student')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    return res;
}

export const config = {
    matcher: ['/prof/:path*', '/student/:path*']
};
```

---

## 7. Composants Clés

### Composants UI (shadcn/ui)

| Composant | Usage | Props principales |
|-----------|-------|-------------------|
| `Button` | Actions principales | `variant, size, disabled, loading` |
| `Card` | Conteneurs exercices | `title, description, footer` |
| `Input` | Champs formulaires | `type, placeholder, error` |
| `Textarea` | Énoncés longs | `rows, maxLength` |
| `Select` | Sélection type/catégorie | `options, value, onChange` |
| `Dialog` | Modales confirmation | `open, onOpenChange, children` |
| `Table` | Listes étudiants/stats | `columns, data, pagination` |
| `Badge` | Statuts exercices | `variant (draft/published/archived)` |
| `Tabs` | Navigation sections | `tabs, activeTab` |
| `Toast` | Notifications | `title, description, variant` |

### Composants Métier

| Composant | Fichier | Props | Description |
|-----------|---------|-------|-------------|
| `TypeSelector` | `type-selector.tsx` | `onSelect, selectedId, category?` | Grille de sélection des types RDM avec filtres |
| `ExerciseCard` | `exercise-card.tsx` | `exercise, onEdit?, onDelete?` | Card avec titre, statut, actions |
| `ExerciseEditor` | `exercise-editor.tsx` | `exercise, onSave` | Éditeur complet avec énoncé, variables, preview |
| `FormulaDisplay` | `formula-display.tsx` | `latex, size?` | Rendu LaTeX avec KaTeX |
| `VariableConfig` | `variable-config.tsx` | `variables, ranges, onChange` | Configuration plages min/max/mode |
| `ExercisePreview` | `exercise-preview.tsx` | `statement, values` | Prévisualisation avec valeurs sample |
| `AnswerForm` | `answer-form.tsx` | `unit, onSubmit, disabled?` | Champ numérique + unité + bouton |
| `SolutionDisplay` | `solution-display.tsx` | `solution, show` | Affichage résolution étape par étape |
| `StatsCard` | `stats-card.tsx` | `title, value, trend?, icon?` | Métrique avec variation |
| `ProgressChart` | `progress-chart.tsx` | `data, type` | Graphique évolution |
| `StudentTable` | `student-table.tsx` | `students, exerciseId?` | Tableau avec tri/filtres |

---

## 8. Intégration Google Gemini

### Configuration

```typescript
// src/lib/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
    }
});
```

### Prompts Templates

```typescript
// src/lib/gemini/prompts.ts

export const EXERCISE_GENERATION_PROMPT = `
Tu es un professeur de Résistance des Matériaux à l'université.
Génère un exercice basé sur le type suivant:

TYPE: {typeName}
CATÉGORIE: {category}
FORMULES: {formulas}
VARIABLES: {variables}
UNITÉ RÉSULTAT: {resultUnit}

CONTEXTE SOUHAITÉ (optionnel): {context}

Génère un JSON avec la structure suivante:
{
  "statement": "Énoncé contextualisé de l'exercice avec les variables entre accolades {L}, {b}...",
  "ranges": {
    "L": {"min": 2, "max": 8, "mode": "palier", "step": 0.5},
    "b": {"min": 10, "max": 30, "mode": "libre", "decimals": 0}
  },
  "solution": "Résolution détaillée étape par étape avec formules"
}

RÈGLES:
- L'énoncé doit être réaliste (pont, bâtiment, machine, passerelle...)
- Les plages de valeurs doivent être cohérentes physiquement
- La résolution doit être pédagogique avec chaque étape expliquée
- Utilise des valeurs typiques pour le domaine du génie civil
- Réponds UNIQUEMENT avec le JSON, sans texte autour
`;

export const STATEMENT_ONLY_PROMPT = `
Tu es un professeur de Résistance des Matériaux.
Génère UNIQUEMENT un énoncé d'exercice pour:

TYPE: {typeName}
VARIABLES: {variables}
CONTEXTE: {context}

L'énoncé doit:
- Être contextualisé (situation réelle)
- Inclure les variables entre accolades: {L}, {b}, {h}, etc.
- Être en français correct
- Faire environ 3-5 phrases

Réponds uniquement avec l'énoncé, sans JSON ni formatage.
`;
```

### Parser des réponses

```typescript
// src/lib/gemini/parser.ts

export interface GeneratedExercise {
    statement: string;
    ranges: Record<string, {
        min: number;
        max: number;
        mode: 'libre' | 'palier';
        step?: number;
        decimals?: number;
    }>;
    solution: string;
}

export function parseGeminiResponse(response: string): GeneratedExercise {
    // Nettoyer la réponse (enlever ```json si présent)
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    }
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }

    try {
        const parsed = JSON.parse(cleaned);

        // Validation basique
        if (!parsed.statement || !parsed.ranges || !parsed.solution) {
            throw new Error('Structure JSON invalide');
        }

        return parsed as GeneratedExercise;
    } catch (error) {
        throw new Error(`Échec parsing réponse Gemini: ${error}`);
    }
}
```

---

## 9. Calcul des Formules et Variantes

### Évaluateur de formules

```typescript
// src/lib/formulas/calculator.ts
import { create, all } from 'mathjs';

const math = create(all);

export interface FormulaDefinition {
    name: string;
    latex: string;
    code: string;  // Expression évaluable: "(P * L) / 4"
    description: string;
}

export function evaluateFormula(
    formula: string,
    variables: Record<string, number>
): number {
    try {
        const scope = { ...variables };
        const result = math.evaluate(formula, scope);
        return typeof result === 'number' ? result : Number(result);
    } catch (error) {
        throw new Error(`Erreur évaluation formule: ${formula}`);
    }
}

export function calculateFinalAnswer(
    formulas: FormulaDefinition[],
    variables: Record<string, number>
): number {
    let scope = { ...variables };

    // Évaluer les formules dans l'ordre (chaînage)
    for (const formula of formulas) {
        const result = evaluateFormula(formula.code, scope);
        // Le nom de la formule devient une variable pour les suivantes
        scope[formula.name] = result;
    }

    // La dernière formule donne le résultat final
    const lastFormula = formulas[formulas.length - 1];
    return scope[lastFormula.name];
}
```

### Générateur de variantes

```typescript
// src/lib/utils/variants.ts
import { createHash } from 'crypto';

export interface RangeConfig {
    min: number;
    max: number;
    mode: 'libre' | 'palier';
    step?: number;
    decimals?: number;
}

export function generateVariantValues(
    ranges: Record<string, RangeConfig>,
    exerciseId: string,
    studentId: string,
    seed?: string
): Record<string, number> {
    // Seed déterministe basé sur exercice + étudiant
    const seedString = `${exerciseId}-${studentId}-${seed || 'default'}`;
    const hash = createHash('sha256').update(seedString).digest('hex');

    // Convertir le hash en nombres pseudo-aléatoires
    const values: Record<string, number> = {};
    let hashIndex = 0;

    for (const [variable, config] of Object.entries(ranges)) {
        // Utiliser 8 caractères du hash pour chaque variable
        const hexSlice = hash.slice(hashIndex, hashIndex + 8);
        const randomFactor = parseInt(hexSlice, 16) / 0xffffffff;
        hashIndex = (hashIndex + 8) % 56; // Recycler le hash si nécessaire

        let value: number;

        if (config.mode === 'palier' && config.step) {
            // Mode palier: valeurs discrètes
            const steps = Math.floor((config.max - config.min) / config.step);
            const stepIndex = Math.floor(randomFactor * (steps + 1));
            value = config.min + stepIndex * config.step;
        } else {
            // Mode libre: valeur continue arrondie
            const rawValue = config.min + randomFactor * (config.max - config.min);
            const decimals = config.decimals ?? 1;
            value = Math.round(rawValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
        }

        values[variable] = value;
    }

    return values;
}

export function fillStatement(
    template: string,
    values: Record<string, number>,
    units: Record<string, string>
): string {
    let filled = template;

    for (const [variable, value] of Object.entries(values)) {
        const unit = units[variable] || '';
        const replacement = `${value} ${unit}`.trim();
        filled = filled.replace(new RegExp(`\\{${variable}\\}`, 'g'), replacement);
    }

    return filled;
}
```

### Vérification de la réponse

```typescript
// src/lib/utils/tolerance.ts

export interface ToleranceResult {
    isCorrect: boolean;
    deviation: number;  // Écart en %
    expectedAnswer: number;
    givenAnswer: number;
}

export function checkAnswer(
    givenAnswer: number,
    expectedAnswer: number,
    tolerancePercent: number
): ToleranceResult {
    // Calcul de l'écart relatif
    const deviation = Math.abs(givenAnswer - expectedAnswer) / Math.abs(expectedAnswer) * 100;

    return {
        isCorrect: deviation <= tolerancePercent,
        deviation: Math.round(deviation * 100) / 100,
        expectedAnswer,
        givenAnswer
    };
}
```

---

## 10. Variables d'Environnement

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...  # Pour actions admin

# Google Gemini
GEMINI_API_KEY=AIzaSy...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optionnel: Email (pour invitations étudiants)
# RESEND_API_KEY=re_...
```

### Configuration Vercel

| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Clé anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Clé admin (création users) |
| `GEMINI_API_KEY` | Secret | Clé API Google Gemini |

---

## 11. Performance et Optimisations

### Stratégies de cache

| Donnée | Stratégie | TTL | Justification |
|--------|-----------|-----|---------------|
| Types système | `revalidate: 3600` | 1h | Rarement modifiés |
| Exercices publiés | `revalidate: 60` | 1min | Mises à jour peu fréquentes |
| Variantes étudiant | Cache client | Session | Données stables |
| Stats agrégées | `revalidate: 300` | 5min | Recalcul coûteux |

### Optimisations Next.js

```typescript
// next.config.js
module.exports = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            }
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb', // Pour upload images
        },
    },
};
```

### Lazy loading composants lourds

```typescript
// Composants avec KaTeX (formules) chargés à la demande
const FormulaDisplay = dynamic(
    () => import('@/components/exercise/formula-display'),
    { loading: () => <Skeleton className="h-8 w-32" /> }
);

// Charts chargés à la demande
const ProgressChart = dynamic(
    () => import('@/components/stats/progress-chart'),
    { ssr: false }
);
```

---

## 12. Sécurité

### Mesures implémentées

| Mesure | Implémentation | Protection contre |
|--------|----------------|-------------------|
| **RLS Supabase** | Policies par rôle | Accès données non autorisé |
| **Auth middleware** | Vérification session + rôle | Accès routes non autorisé |
| **Input validation** | Zod schemas | Injection, données malformées |
| **Rate limiting** | Vercel Edge | Abus API Gemini |
| **CORS** | Next.js config | Requêtes cross-origin |
| **Sanitization** | DOMPurify | XSS dans énoncés |

### Validation des entrées

```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

export const exerciseSchema = z.object({
    typeId: z.string().uuid(),
    title: z.string().min(3).max(200),
    statement: z.string().min(10).max(5000),
    ranges: z.record(z.object({
        min: z.number(),
        max: z.number(),
        mode: z.enum(['libre', 'palier']),
        step: z.number().optional(),
        decimals: z.number().min(0).max(6).optional(),
    })),
    tolerance: z.number().min(0.1).max(20),
    deadline: z.string().datetime().optional(),
});

export const answerSchema = z.object({
    instanceId: z.string().uuid(),
    answer: z.number().finite(),
});

export const studentSchema = z.object({
    email: z.string().email(),
    fullName: z.string().min(2).max(100),
    password: z.string().min(8),
});
```

---

## 13. Tests

### Configuration Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
```

### Tests unitaires critiques

```typescript
// tests/unit/formulas.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateFormula, calculateFinalAnswer } from '@/lib/formulas/calculator';

describe('Formula Calculator', () => {
    it('should evaluate simple formula', () => {
        const result = evaluateFormula('(P * L) / 4', { P: 10, L: 4 });
        expect(result).toBe(10);
    });

    it('should calculate flexion bi-appuyée correctly', () => {
        const formulas = [
            { name: 'Mf', code: '(P * L) / 4', latex: '', description: '' },
            { name: 'I', code: '(b * h^3) / 12', latex: '', description: '' },
            { name: 'sigma', code: '(Mf * (h/2)) / I', latex: '', description: '' },
        ];
        const variables = { P: 10000, L: 4, b: 0.2, h: 0.4 }; // N, m

        const result = calculateFinalAnswer(formulas, variables);
        // Mf = 10000 * 4 / 4 = 10000 N.m
        // I = 0.2 * 0.4^3 / 12 = 0.001067 m^4
        // sigma = 10000 * 0.2 / 0.001067 = 1875000 Pa ≈ 1.875 MPa
        expect(result).toBeCloseTo(1875000, 0);
    });
});

// tests/unit/tolerance.test.ts
import { describe, it, expect } from 'vitest';
import { checkAnswer } from '@/lib/utils/tolerance';

describe('Tolerance Check', () => {
    it('should accept answer within tolerance', () => {
        const result = checkAnswer(102, 100, 5); // 2% d'écart, tolérance 5%
        expect(result.isCorrect).toBe(true);
        expect(result.deviation).toBe(2);
    });

    it('should reject answer outside tolerance', () => {
        const result = checkAnswer(110, 100, 5); // 10% d'écart, tolérance 5%
        expect(result.isCorrect).toBe(false);
        expect(result.deviation).toBe(10);
    });
});
```

### Tests E2E Playwright

```typescript
// tests/e2e/prof-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Professor Workflow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as prof
        await page.goto('/login');
        await page.fill('[name="email"]', 'prof@test.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/prof/dashboard');
    });

    test('should create and publish exercise', async ({ page }) => {
        // Aller à création
        await page.click('text=Nouvel exercice');

        // Sélectionner type
        await page.click('[data-type="flexion-bi-appuyee"]');

        // Générer avec IA
        await page.click('text=Générer avec IA');
        await expect(page.locator('[data-testid="statement"]')).not.toBeEmpty();

        // Valider
        await page.click('text=Valider');
        await expect(page.locator('[data-status="validated"]')).toBeVisible();

        // Publier
        await page.fill('[name="title"]', 'Exercice test');
        await page.click('text=Publier');
        await expect(page.locator('[data-status="published"]')).toBeVisible();
    });
});
```

---

## 14. Déploiement

### Checklist pré-déploiement

- [ ] Variables d'environnement configurées sur Vercel
- [ ] Migrations Supabase exécutées
- [ ] Données seed (types RDM) insérées
- [ ] Compte professeur initial créé
- [ ] Tests passent en CI
- [ ] Build Next.js sans erreurs

### Commandes de déploiement

```bash
# Local
npm run dev          # Développement
npm run build        # Build production
npm run start        # Serveur production local

# Supabase
npx supabase login
npx supabase link --project-ref <project-id>
npx supabase db push                    # Appliquer migrations
npx supabase gen types typescript --local > src/types/database.ts

# Vercel (automatique via GitHub)
git push origin main  # Déclenche déploiement
```

---

## 15. Bibliothèque de Types RDM (Seed)

```sql
-- 003_seed_types.sql

INSERT INTO types (name, category, description, formulas, variables, result_unit, is_system) VALUES

-- FLEXION
('Flexion poutre bi-appuyée - charge ponctuelle', 'flexion',
 'Poutre sur deux appuis simples avec charge ponctuelle au centre',
 '[
   {"name": "Mf", "latex": "M_f = \\frac{P \\times L}{4}", "code": "(P * L) / 4", "description": "Moment fléchissant max"},
   {"name": "I", "latex": "I = \\frac{b \\times h^3}{12}", "code": "(b * h^3) / 12", "description": "Moment d''inertie"},
   {"name": "sigma", "latex": "\\sigma = \\frac{M_f \\times y}{I}", "code": "(Mf * (h/2)) / I", "description": "Contrainte normale max"}
 ]',
 '[
   {"symbol": "P", "name": "Charge ponctuelle", "unit": "N", "description": "Force appliquée au centre"},
   {"symbol": "L", "name": "Longueur", "unit": "m", "description": "Portée de la poutre"},
   {"symbol": "b", "name": "Largeur", "unit": "m", "description": "Largeur de la section"},
   {"symbol": "h", "name": "Hauteur", "unit": "m", "description": "Hauteur de la section"}
 ]',
 'Pa', TRUE),

('Flexion poutre encastrée-libre', 'flexion',
 'Poutre encastrée à une extrémité avec charge à l''extrémité libre',
 '[
   {"name": "Mf", "latex": "M_f = P \\times L", "code": "P * L", "description": "Moment fléchissant max (à l''encastrement)"},
   {"name": "I", "latex": "I = \\frac{b \\times h^3}{12}", "code": "(b * h^3) / 12", "description": "Moment d''inertie"},
   {"name": "sigma", "latex": "\\sigma = \\frac{M_f \\times y}{I}", "code": "(Mf * (h/2)) / I", "description": "Contrainte normale max"}
 ]',
 '[
   {"symbol": "P", "name": "Charge", "unit": "N", "description": "Force à l''extrémité libre"},
   {"symbol": "L", "name": "Longueur", "unit": "m", "description": "Longueur de la poutre"},
   {"symbol": "b", "name": "Largeur", "unit": "m", "description": "Largeur de la section"},
   {"symbol": "h", "name": "Hauteur", "unit": "m", "description": "Hauteur de la section"}
 ]',
 'Pa', TRUE),

-- TORSION
('Torsion arbre cylindrique plein', 'torsion',
 'Arbre cylindrique plein soumis à un couple de torsion',
 '[
   {"name": "Ip", "latex": "I_p = \\frac{\\pi \\times d^4}{32}", "code": "(PI * d^4) / 32", "description": "Moment d''inertie polaire"},
   {"name": "tau", "latex": "\\tau = \\frac{Mt \\times r}{I_p}", "code": "(Mt * (d/2)) / Ip", "description": "Contrainte de cisaillement max"}
 ]',
 '[
   {"symbol": "Mt", "name": "Moment de torsion", "unit": "N.m", "description": "Couple appliqué"},
   {"symbol": "d", "name": "Diamètre", "unit": "m", "description": "Diamètre de l''arbre"}
 ]',
 'Pa', TRUE),

('Torsion arbre cylindrique creux', 'torsion',
 'Arbre cylindrique creux soumis à un couple de torsion',
 '[
   {"name": "Ip", "latex": "I_p = \\frac{\\pi \\times (D^4 - d^4)}{32}", "code": "(PI * (D^4 - d^4)) / 32", "description": "Moment d''inertie polaire"},
   {"name": "tau", "latex": "\\tau = \\frac{Mt \\times R}{I_p}", "code": "(Mt * (D/2)) / Ip", "description": "Contrainte de cisaillement max"}
 ]',
 '[
   {"symbol": "Mt", "name": "Moment de torsion", "unit": "N.m", "description": "Couple appliqué"},
   {"symbol": "D", "name": "Diamètre extérieur", "unit": "m", "description": "Diamètre externe"},
   {"symbol": "d", "name": "Diamètre intérieur", "unit": "m", "description": "Diamètre interne"}
 ]',
 'Pa', TRUE),

-- TRACTION
('Traction simple', 'traction',
 'Barre soumise à un effort de traction axial',
 '[
   {"name": "sigma", "latex": "\\sigma = \\frac{F}{S}", "code": "F / S", "description": "Contrainte normale"}
 ]',
 '[
   {"symbol": "F", "name": "Force", "unit": "N", "description": "Effort de traction"},
   {"symbol": "S", "name": "Section", "unit": "m²", "description": "Aire de la section"}
 ]',
 'Pa', TRUE),

('Allongement barre', 'traction',
 'Allongement d''une barre sous charge de traction',
 '[
   {"name": "deltaL", "latex": "\\Delta L = \\frac{F \\times L}{E \\times S}", "code": "(F * L) / (E * S)", "description": "Allongement"}
 ]',
 '[
   {"symbol": "F", "name": "Force", "unit": "N", "description": "Effort de traction"},
   {"symbol": "L", "name": "Longueur", "unit": "m", "description": "Longueur initiale"},
   {"symbol": "E", "name": "Module de Young", "unit": "Pa", "description": "Module d''élasticité"},
   {"symbol": "S", "name": "Section", "unit": "m²", "description": "Aire de la section"}
 ]',
 'm', TRUE),

-- THERMIQUE
('Contrainte thermique barre encastrée', 'thermique',
 'Contrainte dans une barre encastrée aux deux extrémités lors d''une variation de température',
 '[
   {"name": "sigma", "latex": "\\sigma = E \\times \\alpha \\times \\Delta T", "code": "E * alpha * deltaT", "description": "Contrainte thermique"}
 ]',
 '[
   {"symbol": "E", "name": "Module de Young", "unit": "Pa", "description": "Module d''élasticité"},
   {"symbol": "alpha", "name": "Coefficient dilatation", "unit": "1/°C", "description": "Coefficient de dilatation thermique"},
   {"symbol": "deltaT", "name": "Variation température", "unit": "°C", "description": "Écart de température"}
 ]',
 'Pa', TRUE);
```

---

*Document d'architecture v1.0*
*Projet : RDM-Exercices*
*Client : Université de Bordeaux - Département Génie Civil*
*Généré le 2024-12-24*

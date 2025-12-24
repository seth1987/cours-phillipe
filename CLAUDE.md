# CLAUDE.md - Générateur d'Exercices

## Project Overview
- **Nom** : generateur-exercices
- **Type** : web-nextjs (Next.js App Router)
- **Créé** : 2025-12-23
- **Langue** : Français

## Tech Stack
- **Framework** : Next.js 14+ (App Router)
- **Database** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth
- **Styling** : Tailwind CSS
- **Language** : TypeScript (strict mode)
- **Testing** : Vitest

## Project Structure
```
generateur-exercices/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Routes authentification
│   │   ├── (dashboard)/       # Routes tableau de bord
│   │   ├── api/               # API Routes
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Page d'accueil
│   ├── components/
│   │   ├── ui/                # Composants UI de base
│   │   ├── forms/             # Composants formulaires
│   │   └── exercises/         # Composants exercices
│   ├── lib/
│   │   ├── supabase/          # Client et utils Supabase
│   │   ├── utils/             # Utilitaires généraux
│   │   └── core/              # Logique métier (READ ONLY)
│   ├── types/                 # Définitions TypeScript
│   └── hooks/                 # React Hooks personnalisés
├── spec/                      # Spécifications du projet
├── tasks/                     # Fichiers de tâches
├── tests/                     # Tests Vitest
├── public/                    # Assets statiques
└── CLAUDE.md                  # Ce fichier
```

## Coding Conventions
- **Fichiers** : kebab-case (ex: `exercise-card.tsx`)
- **Composants** : PascalCase (ex: `ExerciseCard`)
- **Variables** : camelCase (ex: `exerciseList`)
- **Constantes** : UPPER_SNAKE_CASE (ex: `MAX_EXERCISES`)
- **Types/Interfaces** : PascalCase avec préfixe I pour interfaces (ex: `IExercise`)
- **Hooks** : préfixe use (ex: `useExercises`)

## STRICT RULES (Claude MUST follow)
1. **JAMAIS** ajouter console.log en production
2. **JAMAIS** utiliser le type 'any' en TypeScript
3. **JAMAIS** ajouter de nouvelles dépendances sans demander
4. **JAMAIS** modifier les fichiers dans /lib/core/ ou /lib/supabase/client.ts
5. **JAMAIS** supprimer des tests existants
6. **JAMAIS** refactorer sans approbation explicite
7. **TOUJOURS** suivre les patterns existants dans le codebase
8. **TOUJOURS** exécuter lint et typecheck avant de terminer une tâche
9. **TOUJOURS** écrire en français pour les commentaires et messages utilisateur

## File-Specific Rules
- `src/lib/core/*` : READ ONLY - ne jamais modifier
- `src/types/*` : Ajouter les types ici, jamais inline
- `src/components/ui/*` : Composants de base, rarement modifier
- `src/lib/supabase/client.ts` : Configuration Supabase, ne pas modifier

## Supabase Configuration
```typescript
// Variables d'environnement requises
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Commands
```bash
# Développement
npm run dev          # Démarrer le serveur de développement
npm run build        # Build de production
npm run start        # Démarrer en production

# Qualité
npm run lint         # Linting ESLint
npm run typecheck    # Vérification TypeScript
npm run test         # Lancer les tests Vitest
npm run test:watch   # Tests en mode watch

# Supabase
npx supabase login   # Se connecter à Supabase
npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
```

## Learned Rules (à compléter au fil du projet)
<!-- Ajouter ici les règles apprises suite à des erreurs -->


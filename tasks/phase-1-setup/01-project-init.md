# Tâche 01 - Initialisation du Projet Next.js

## Contexte
Première étape fondamentale : créer le projet Next.js 14 avec toutes les dépendances nécessaires et la configuration de base.

## User Stories liées
- Aucune directement, mais bloque toutes les autres tâches

## Durée estimée
**1-2 heures**

## Requirements

### Checklist
- [ ] Créer le projet Next.js 14 avec App Router
- [ ] Configurer TypeScript en mode strict
- [ ] Installer et configurer Tailwind CSS
- [ ] Installer shadcn/ui et composants de base
- [ ] Configurer les alias de chemin (@/)
- [ ] Créer le fichier .env.example
- [ ] Initialiser Git avec .gitignore approprié

### Dépendances à installer
```bash
# Core
next@14
react@18
react-dom@18
typescript

# Styling
tailwindcss
postcss
autoprefixer

# UI
@radix-ui/react-* (via shadcn)
class-variance-authority
clsx
tailwind-merge
lucide-react

# Utils
zod
```

## Acceptance Criteria

1. ✅ `npm run dev` démarre sans erreur sur localhost:3000
2. ✅ TypeScript compile sans erreur (`npm run typecheck`)
3. ✅ Une page d'accueil s'affiche avec un composant shadcn/ui (Button)
4. ✅ Les alias @/ fonctionnent dans les imports
5. ✅ Le fichier .env.example existe avec les variables documentées

## Technical Notes

### Configuration TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Composants shadcn/ui à installer
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input
```

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `package.json` | Create | Dépendances projet |
| `tsconfig.json` | Create | Config TypeScript strict |
| `tailwind.config.ts` | Create | Config Tailwind + shadcn |
| `next.config.js` | Create | Config Next.js |
| `src/app/layout.tsx` | Create | Layout racine |
| `src/app/page.tsx` | Create | Page d'accueil temporaire |
| `src/app/globals.css` | Create | Styles Tailwind |
| `src/lib/utils.ts` | Create | Utilitaire cn() pour classes |
| `.env.example` | Create | Template variables env |
| `.gitignore` | Create | Fichiers à ignorer |

## Dependencies (blockers)
Aucune - c'est la première tâche

## Commands

```bash
# Création projet
npx create-next-app@14 rdm-exercices --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Installation shadcn/ui
cd rdm-exercices
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label textarea select dialog table badge tabs toast

# Vérification
npm run dev
npm run build
```

# Tâche 02 - Configuration Supabase

## Contexte
Configurer le projet Supabase : créer le projet cloud, configurer les clients (browser/server), et préparer l'environnement.

## User Stories liées
- US-014 : Authentification utilisateur

## Durée estimée
**1-2 heures**

## Requirements

### Checklist
- [ ] Créer un projet Supabase (gratuit)
- [ ] Récupérer les clés API (anon, service_role)
- [ ] Installer les dépendances Supabase
- [ ] Créer le client Supabase côté browser
- [ ] Créer le client Supabase côté server
- [ ] Configurer les variables d'environnement
- [ ] Tester la connexion à Supabase

### Dépendances à installer
```bash
@supabase/supabase-js
@supabase/ssr
```

## Acceptance Criteria

1. ✅ Le projet Supabase est créé et accessible
2. ✅ Les variables d'environnement sont configurées dans .env.local
3. ✅ Le client browser peut se connecter (test ping)
4. ✅ Le client server peut se connecter (test ping)
5. ✅ Les types TypeScript Supabase sont générés

## Technical Notes

### Structure des clients
- **Browser client** : Pour les composants client (useEffect, etc.)
- **Server client** : Pour les Server Components et Server Actions
- **Middleware client** : Pour la protection des routes

### Variables d'environnement requises
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/lib/supabase/client.ts` | Create | Client browser |
| `src/lib/supabase/server.ts` | Create | Client server |
| `src/lib/supabase/middleware.ts` | Create | Client middleware |
| `src/types/database.ts` | Create | Types générés (vide pour l'instant) |
| `.env.local` | Create | Variables réelles (gitignored) |
| `.env.example` | Modify | Ajouter variables Supabase |

## Dependencies (blockers)
- ✅ Tâche 01 - Project Init

## Code Examples

### Client Browser (src/lib/supabase/client.ts)
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Client Server (src/lib/supabase/server.ts)
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}
```

## Commands

```bash
# Installation
npm install @supabase/supabase-js @supabase/ssr

# Génération types (après création tables)
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

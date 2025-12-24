# Tâche 05 - Système d'Authentification

## Contexte
Implémenter le système d'authentification complet : login, logout, middleware de protection des routes, et création du premier compte professeur.

## User Stories liées
- US-014 : En tant qu'Utilisateur, je veux m'authentifier afin d'accéder à mon espace

## Durée estimée
**2-3 heures**

## Requirements

### Checklist
- [ ] Créer la page de login (/login)
- [ ] Implémenter les Server Actions auth (signIn, signOut)
- [ ] Créer le middleware de protection des routes
- [ ] Redirection automatique selon le rôle
- [ ] Créer le premier compte professeur manuellement
- [ ] Créer le hook useAuth pour le client
- [ ] Gérer les erreurs d'authentification

## Acceptance Criteria

1. ✅ Un utilisateur peut se connecter avec email/mot de passe
2. ✅ Un utilisateur connecté est redirigé vers son dashboard (prof/student)
3. ✅ Un utilisateur non connecté est redirigé vers /login
4. ✅ Un étudiant ne peut pas accéder aux routes /prof/*
5. ✅ Le premier compte prof existe et peut se connecter

## Technical Notes

### Flux d'authentification
1. Utilisateur accède à une route protégée
2. Middleware vérifie la session
3. Si pas de session → redirect /login
4. Si session → vérifie le rôle dans profiles
5. Redirect vers le bon dashboard

### Routes par rôle
- `/prof/*` → role = 'prof'
- `/student/*` → role = 'student'
- `/login`, `/` → public

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/(auth)/login/page.tsx` | Create | Page de connexion |
| `src/app/(auth)/layout.tsx` | Create | Layout auth (centré) |
| `src/actions/auth.ts` | Create | Server Actions auth |
| `src/middleware.ts` | Create | Protection routes |
| `src/hooks/use-auth.ts` | Create | Hook client auth |
| `src/components/forms/login-form.tsx` | Create | Formulaire login |

## Dependencies (blockers)
- ✅ Tâche 02 - Supabase Setup
- ✅ Tâche 03 - Database Schema
- ✅ Tâche 04 - RLS Policies

## Code Examples

### Server Actions (src/actions/auth.ts)
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return { error: error.message };
  }

  // Récupérer le rôle pour redirect
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  revalidatePath('/', 'layout');
  redirect(profile?.role === 'prof' ? '/prof/dashboard' : '/student/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
```

### Middleware (src/middleware.ts)
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Routes protégées
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/prof') ||
                          request.nextUrl.pathname.startsWith('/student');

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Vérifier rôle pour routes prof
  if (request.nextUrl.pathname.startsWith('/prof') && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'prof') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
  }

  // Redirect si déjà connecté sur /login
  if (request.nextUrl.pathname === '/login' && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const redirectUrl = profile?.role === 'prof' ? '/prof/dashboard' : '/student/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

### Création premier compte Prof (SQL)
```sql
-- Exécuter dans Supabase SQL Editor
-- 1. D'abord créer l'utilisateur via Dashboard Auth
-- 2. Puis créer son profil:
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'UUID_FROM_AUTH_USERS', -- Remplacer par l'UUID réel
  'prof@universite-bordeaux.fr',
  'Professeur RDM',
  'prof'
);
```

## Test Scenarios

1. **Login valide** → Redirect vers dashboard
2. **Login invalide** → Message d'erreur
3. **Accès /prof sans auth** → Redirect /login
4. **Étudiant accède /prof** → Redirect /student/dashboard
5. **Logout** → Session supprimée, redirect /login

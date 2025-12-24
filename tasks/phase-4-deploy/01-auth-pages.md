# Tâche 20 - Pages d'Authentification

## Contexte
Créer les pages de login et de gestion d'erreurs d'authentification avec un design soigné.

## User Stories liées
- Toutes les US (authentification requise)

## Durée estimée
**1-2 heures**

## Requirements

### Checklist
- [ ] Page de login (/login)
- [ ] Formulaire email/password
- [ ] Gestion des erreurs de connexion
- [ ] Redirection après login selon le rôle
- [ ] Page d'erreur auth (/auth/error)
- [ ] Design responsive et accessible

## Acceptance Criteria

1. ✅ Le formulaire de login fonctionne
2. ✅ Les erreurs sont affichées clairement
3. ✅ Redirection vers /prof ou /student selon le rôle
4. ✅ Design cohérent avec le reste de l'app

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/(auth)/login/page.tsx` | Create | Page login |
| `src/app/(auth)/layout.tsx` | Create | Layout auth |
| `src/components/auth/login-form.tsx` | Create | Formulaire |

## Dependencies (blockers)
- ✅ Tâche 05 - Auth System

## Code Examples

### Login Page (src/app/(auth)/login/page.tsx)
```typescript
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">RDM Exercices</CardTitle>
          <CardDescription>
            Plateforme d'exercices de Résistance des Matériaux
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Login Form (src/components/auth/login-form.tsx)
```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { login } from '@/actions/auth';
import { Loader2, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const errorMessage = searchParams.get('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login({ email, password });

      if (result.error) {
        setError(result.error);
        return;
      }

      // Rediriger selon le rôle
      if (result.data.role === 'prof') {
        router.push('/prof');
      } else {
        router.push('/student');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(error || errorMessage) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.fr"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connexion...
          </>
        ) : (
          'Se connecter'
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground mt-4">
        Université de Bordeaux - Département Génie Civil
      </p>
    </form>
  );
}
```

### Auth Layout (src/app/(auth)/layout.tsx)
```typescript
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

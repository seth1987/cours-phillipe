# Tâche 21 - Gestion des Erreurs et Loading

## Contexte
Implémenter une gestion globale des erreurs, des états de chargement et des pages d'erreur personnalisées.

## User Stories liées
- Toutes les US (expérience utilisateur)

## Durée estimée
**2 heures**

## Requirements

### Checklist
- [ ] Page 404 personnalisée
- [ ] Page d'erreur globale (error.tsx)
- [ ] Composants de loading (Skeleton)
- [ ] Toast notifications (sonner)
- [ ] Boundary d'erreur pour les composants

## Acceptance Criteria

1. ✅ Les erreurs sont gérées gracieusement
2. ✅ Les états de chargement sont visuels
3. ✅ Les notifications toast fonctionnent
4. ✅ Les pages 404 sont informatives

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/not-found.tsx` | Create | Page 404 |
| `src/app/error.tsx` | Create | Page erreur |
| `src/app/(protected)/loading.tsx` | Create | Loading global |
| `src/components/ui/skeleton-card.tsx` | Create | Skeleton card |
| `src/app/layout.tsx` | Modify | Ajouter Toaster |

## Dependencies (blockers)
- ✅ Tâche 01 - Project Init

## Code Examples

### Page 404 (src/app/not-found.tsx)
```typescript
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-semibold mt-4">Page non trouvée</h2>
        <p className="text-muted-foreground mt-2">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

### Page Erreur (src/app/error.tsx)
```typescript
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
        <h2 className="text-2xl font-semibold mt-4">Une erreur est survenue</h2>
        <p className="text-muted-foreground mt-2">
          Nous nous excusons pour ce désagrément. Veuillez réessayer.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-2">
            Code erreur: {error.digest}
          </p>
        )}
        <Button onClick={reset} className="mt-6">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    </div>
  );
}
```

### Loading Global (src/app/(protected)/loading.tsx)
```typescript
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground mt-2">Chargement...</p>
      </div>
    </div>
  );
}
```

### Skeleton Card (src/components/ui/skeleton-card.tsx)
```typescript
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
```

### Layout avec Toaster (src/app/layout.tsx - modification)
```typescript
import { Toaster } from 'sonner';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
```

## Commands

```bash
# Installer sonner pour les toast
npm install sonner
```

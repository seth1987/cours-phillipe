# Tâche 14 - Bibliothèque des Types RDM

## Contexte
Créer l'interface de sélection des types RDM avec affichage des formules et catégories.

## User Stories liées
- US-001 : Choisir un TYPE dans la bibliothèque

## Durée estimée
**2-3 heures**

## Requirements

### Checklist
- [ ] Page liste des types avec filtrage par catégorie
- [ ] Card de type avec infos clés
- [ ] Modal de détail du type avec formules
- [ ] Affichage LaTeX des formules
- [ ] Bouton "Créer un exercice" depuis un type
- [ ] Recherche par nom

## Acceptance Criteria

1. ✅ Les types sont groupés par catégorie
2. ✅ Les formules s'affichent correctement en notation mathématique
3. ✅ Le prof peut créer un exercice depuis n'importe quel type
4. ✅ Les variables du type sont clairement listées

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/(protected)/prof/types/page.tsx` | Create | Page liste types |
| `src/components/types/type-card.tsx` | Create | Card d'un type |
| `src/components/types/type-detail-modal.tsx` | Create | Modal détail |
| `src/components/types/category-filter.tsx` | Create | Filtre catégorie |
| `src/components/ui/latex.tsx` | Create | Rendu LaTeX |

## Dependencies (blockers)
- ✅ Tâche 06 - Seed Types
- ✅ Tâche 11 - Exercise Actions (getTypes)
- ✅ Tâche 13 - Layout

## Code Examples

### Page Types (src/app/(protected)/prof/types/page.tsx)
```typescript
import { getTypes } from '@/actions/types';
import { TypeCard } from '@/components/types/type-card';
import { CategoryFilter } from '@/components/types/category-filter';

export default async function TypesPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const { data: types, error } = await getTypes(searchParams.category);

  if (error) {
    return <div className="text-red-500">Erreur: {error}</div>;
  }

  // Grouper par catégorie
  const categories = [...new Set(types?.map(t => t.category) || [])];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Types d'exercices RDM</h1>
        <p className="text-muted-foreground">
          Sélectionnez un type pour créer un nouvel exercice
        </p>
      </div>

      <CategoryFilter
        categories={categories}
        selected={searchParams.category}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {types?.map((type) => (
          <TypeCard key={type.id} type={type} />
        ))}
      </div>
    </div>
  );
}
```

### Type Card (src/components/types/type-card.tsx)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TypeDetailModal } from './type-detail-modal';
import { Latex } from '@/components/ui/latex';
import { Eye, Plus } from 'lucide-react';
import Link from 'next/link';

interface TypeCardProps {
  type: {
    id: string;
    name: string;
    category: string;
    description: string;
    result_unit: string;
    formulas: Array<{ name: string; latex: string }>;
  };
}

export function TypeCard({ type }: TypeCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{type.name}</CardTitle>
            <Badge variant="outline">{type.category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground mb-4">
            {type.description}
          </p>
          <div className="text-sm">
            <span className="font-medium">Résultat : </span>
            <span className="text-muted-foreground">{type.result_unit}</span>
          </div>
          {type.formulas.length > 0 && (
            <div className="mt-2 p-2 bg-muted rounded text-center">
              <Latex formula={type.formulas[type.formulas.length - 1].latex} />
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetail(true)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Détails
          </Button>
          <Button size="sm" asChild>
            <Link href={`/prof/exercices/nouveau?typeId=${type.id}`}>
              <Plus className="h-4 w-4 mr-1" />
              Créer
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <TypeDetailModal
        type={type}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </>
  );
}
```

### LaTeX Component (src/components/ui/latex.tsx)
```typescript
'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

export function Latex({ formula, displayMode = false, className }: LatexProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode,
          throwOnError: false,
          output: 'html',
        });
      } catch (error) {
        containerRef.current.textContent = formula;
      }
    }
  }, [formula, displayMode]);

  return <span ref={containerRef} className={className} />;
}
```

### Type Detail Modal (src/components/types/type-detail-modal.tsx)
```typescript
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Latex } from '@/components/ui/latex';
import { Separator } from '@/components/ui/separator';

interface TypeDetailModalProps {
  type: {
    name: string;
    category: string;
    description: string;
    result_unit: string;
    variables: Array<{ symbol: string; name: string; unit: string }>;
    formulas: Array<{ name: string; latex: string; description: string }>;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TypeDetailModal({ type, open, onOpenChange }: TypeDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type.name}
            <Badge variant="outline">{type.category}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground">{type.description}</p>

          <div>
            <h4 className="font-semibold mb-2">Variables</h4>
            <div className="grid grid-cols-2 gap-2">
              {type.variables.map((v) => (
                <div key={v.symbol} className="flex items-center gap-2 text-sm">
                  <code className="bg-muted px-1 rounded">{v.symbol}</code>
                  <span>{v.name}</span>
                  <span className="text-muted-foreground">({v.unit})</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3">Formules</h4>
            <div className="space-y-4">
              {type.formulas.map((f, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">{f.description}</div>
                  <div className="text-center py-2">
                    <Latex formula={f.latex} displayMode />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm">
            <span className="font-medium">Unité du résultat : </span>
            <code className="bg-muted px-1 rounded">{type.result_unit}</code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Commands

```bash
# Installer KaTeX pour le rendu LaTeX
npm install katex
npm install -D @types/katex
```

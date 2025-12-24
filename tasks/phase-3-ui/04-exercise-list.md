# Tâche 16 - Liste des Exercices (Prof)

## Contexte
Créer l'interface de gestion des exercices du professeur avec filtrage par statut, actions rapides et tableau de bord.

## User Stories liées
- US-005 : Valider puis publier un exercice
- US-007 : Archiver un exercice terminé
- US-008 : Voir les résultats de mes étudiants

## Durée estimée
**3-4 heures**

## Requirements

### Checklist
- [ ] Page liste avec tableau des exercices
- [ ] Filtres par statut (draft, validated, published, archived)
- [ ] Actions contextuelles par exercice
- [ ] Modal de publication (titre, deadline)
- [ ] Statistiques rapides par exercice
- [ ] Bouton création rapide

## Acceptance Criteria

1. ✅ Le prof voit tous ses exercices organisés par statut
2. ✅ Les actions disponibles dépendent du statut
3. ✅ La publication demande un titre et une deadline optionnelle
4. ✅ Les statistiques de résultats sont visibles pour les exercices publiés

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/(protected)/prof/exercices/page.tsx` | Create | Page liste |
| `src/components/exercises/exercise-table.tsx` | Create | Tableau |
| `src/components/exercises/exercise-row.tsx` | Create | Ligne tableau |
| `src/components/exercises/publish-modal.tsx` | Create | Modal publication |
| `src/components/exercises/status-badge.tsx` | Create | Badge statut |
| `src/components/exercises/exercise-actions.tsx` | Create | Menu actions |

## Dependencies (blockers)
- ✅ Tâche 11 - Exercise Actions
- ✅ Tâche 13 - Layout

## Code Examples

### Page Liste (src/app/(protected)/prof/exercices/page.tsx)
```typescript
import { getExercises } from '@/actions/exercises';
import { ExerciseTable } from '@/components/exercises/exercise-table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { data: exercises, error } = await getExercises(searchParams.status);

  if (error) {
    return <div className="text-red-500">Erreur: {error}</div>;
  }

  const stats = {
    draft: exercises?.filter(e => e.status === 'draft').length || 0,
    validated: exercises?.filter(e => e.status === 'validated').length || 0,
    published: exercises?.filter(e => e.status === 'published').length || 0,
    archived: exercises?.filter(e => e.status === 'archived').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes exercices</h1>
          <p className="text-muted-foreground">
            Gérez vos exercices RDM
          </p>
        </div>
        <Button asChild>
          <Link href="/prof/types">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel exercice
          </Link>
        </Button>
      </div>

      <Tabs defaultValue={searchParams.status || 'all'}>
        <TabsList>
          <TabsTrigger value="all" asChild>
            <Link href="/prof/exercices">
              Tous ({exercises?.length || 0})
            </Link>
          </TabsTrigger>
          <TabsTrigger value="draft" asChild>
            <Link href="/prof/exercices?status=draft">
              Brouillons ({stats.draft})
            </Link>
          </TabsTrigger>
          <TabsTrigger value="validated" asChild>
            <Link href="/prof/exercices?status=validated">
              Validés ({stats.validated})
            </Link>
          </TabsTrigger>
          <TabsTrigger value="published" asChild>
            <Link href="/prof/exercices?status=published">
              Publiés ({stats.published})
            </Link>
          </TabsTrigger>
          <TabsTrigger value="archived" asChild>
            <Link href="/prof/exercices?status=archived">
              Archivés ({stats.archived})
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={searchParams.status || 'all'} className="mt-6">
          <ExerciseTable exercises={exercises || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Exercise Table (src/components/exercises/exercise-table.tsx)
```typescript
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExerciseRow } from './exercise-row';

interface Exercise {
  id: string;
  title: string;
  status: string;
  created_at: string;
  published_at: string | null;
  deadline: string | null;
  type: {
    name: string;
    category: string;
  };
}

interface ExerciseTableProps {
  exercises: Exercise[];
}

export function ExerciseTable({ exercises }: ExerciseTableProps) {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun exercice trouvé.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Créé le</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exercises.map((exercise) => (
          <ExerciseRow key={exercise.id} exercise={exercise} />
        ))}
      </TableBody>
    </Table>
  );
}
```

### Exercise Row (src/components/exercises/exercise-row.tsx)
```typescript
'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { StatusBadge } from './status-badge';
import { ExerciseActions } from './exercise-actions';
import { formatDate } from '@/lib/utils';

interface ExerciseRowProps {
  exercise: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    published_at: string | null;
    deadline: string | null;
    type: {
      name: string;
      category: string;
    };
  };
}

export function ExerciseRow({ exercise }: ExerciseRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{exercise.title}</TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{exercise.type.name}</div>
          <div className="text-muted-foreground text-xs">
            {exercise.type.category}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={exercise.status} />
      </TableCell>
      <TableCell>
        {exercise.deadline ? (
          <span className={
            new Date(exercise.deadline) < new Date()
              ? 'text-red-500'
              : ''
          }>
            {formatDate(exercise.deadline)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(exercise.created_at)}
      </TableCell>
      <TableCell className="text-right">
        <ExerciseActions exercise={exercise} />
      </TableCell>
    </TableRow>
  );
}
```

### Status Badge (src/components/exercises/status-badge.tsx)
```typescript
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  validated: { label: 'Validé', variant: 'outline' },
  published: { label: 'Publié', variant: 'default' },
  archived: { label: 'Archivé', variant: 'destructive' },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
```

### Publish Modal (src/components/exercises/publish-modal.tsx)
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { publishExercise } from '@/actions/exercises';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PublishModalProps {
  exercise: {
    id: string;
    title: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishModal({ exercise, open, onOpenChange }: PublishModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(exercise.title);
  const [deadline, setDeadline] = useState('');
  const [showCorrection, setShowCorrection] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    setIsPublishing(true);
    try {
      const result = await publishExercise({
        id: exercise.id,
        title,
        deadline: deadline || null,
        showCorrection,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Exercice publié ! ${result.data.instancesCount} variantes générées.`);
      onOpenChange(false);
      router.refresh();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publier l'exercice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de l'exercice</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Flexion poutre bi-appuyée"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Date limite (optionnel)</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Montrer la correction</Label>
              <p className="text-sm text-muted-foreground">
                Les étudiants pourront voir la solution après archivage
              </p>
            </div>
            <Switch
              checked={showCorrection}
              onCheckedChange={setShowCorrection}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Publier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Exercise Actions (src/components/exercises/exercise-actions.tsx)
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { PublishModal } from './publish-modal';
import {
  MoreHorizontal,
  Edit,
  Send,
  Archive,
  Trash2,
  BarChart,
  Eye,
} from 'lucide-react';
import { deleteExercise, archiveExercise } from '@/actions/exercises';
import { toast } from 'sonner';
import Link from 'next/link';

interface ExerciseActionsProps {
  exercise: {
    id: string;
    title: string;
    status: string;
  };
}

export function ExerciseActions({ exercise }: ExerciseActionsProps) {
  const router = useRouter();
  const [showPublish, setShowPublish] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Supprimer ce brouillon ?')) return;

    const result = await deleteExercise(exercise.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Brouillon supprimé');
    router.refresh();
  };

  const handleArchive = async () => {
    if (!confirm('Archiver cet exercice ? Les étudiants ne pourront plus soumettre.')) return;

    const result = await archiveExercise(exercise.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Exercice archivé');
    router.refresh();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/prof/exercices/${exercise.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </Link>
          </DropdownMenuItem>

          {(exercise.status === 'draft' || exercise.status === 'validated') && (
            <DropdownMenuItem asChild>
              <Link href={`/prof/exercices/${exercise.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </DropdownMenuItem>
          )}

          {exercise.status === 'validated' && (
            <DropdownMenuItem onClick={() => setShowPublish(true)}>
              <Send className="h-4 w-4 mr-2" />
              Publier
            </DropdownMenuItem>
          )}

          {exercise.status === 'published' && (
            <>
              <DropdownMenuItem asChild>
                <Link href={`/prof/exercices/${exercise.id}/resultats`}>
                  <BarChart className="h-4 w-4 mr-2" />
                  Résultats
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </DropdownMenuItem>
            </>
          )}

          {exercise.status === 'draft' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <PublishModal
        exercise={exercise}
        open={showPublish}
        onOpenChange={setShowPublish}
      />
    </>
  );
}
```

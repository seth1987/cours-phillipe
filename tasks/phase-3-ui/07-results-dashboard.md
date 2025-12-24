# Tâche 19 - Dashboard des Résultats

## Contexte
Créer l'interface de visualisation des résultats pour le professeur avec statistiques globales et détail par étudiant.

## User Stories liées
- US-008 : Voir les résultats de mes étudiants

## Durée estimée
**3-4 heures**

## Requirements

### Checklist
- [ ] Page résultats par exercice
- [ ] Tableau avec tous les étudiants et leurs tentatives
- [ ] Statistiques globales (taux réussite, nb tentatives moyen)
- [ ] Graphique de distribution des résultats
- [ ] Export CSV des résultats
- [ ] Filtres (réussi/échoué/non tenté)

## Acceptance Criteria

1. ✅ Le prof voit tous les résultats d'un exercice
2. ✅ Les statistiques globales sont affichées
3. ✅ Chaque étudiant montre son statut et nombre de tentatives
4. ✅ Export CSV fonctionnel

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/(protected)/prof/exercices/[id]/resultats/page.tsx` | Create | Page résultats |
| `src/components/results/results-table.tsx` | Create | Tableau résultats |
| `src/components/results/results-stats.tsx` | Create | Statistiques |
| `src/components/results/export-button.tsx` | Create | Export CSV |

## Dependencies (blockers)
- ✅ Tâche 12 - Student Actions (getExerciseAttempts)
- ✅ Tâche 16 - Exercise List

## Code Examples

### Page Résultats (src/app/(protected)/prof/exercices/[id]/resultats/page.tsx)
```typescript
import { getExercise } from '@/actions/exercises';
import { getExerciseAttempts } from '@/actions/attempts';
import { ResultsTable } from '@/components/results/results-table';
import { ResultsStats } from '@/components/results/results-stats';
import { ExportButton } from '@/components/results/export-button';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const [exerciseResult, attemptsResult] = await Promise.all([
    getExercise(params.id),
    getExerciseAttempts(params.id),
  ]);

  if (exerciseResult.error || !exerciseResult.data) {
    redirect('/prof/exercices');
  }

  const exercise = exerciseResult.data;
  const instances = attemptsResult.data || [];

  // Calculer les statistiques
  const stats = calculateStats(instances);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/prof/exercices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Résultats : {exercise.title}</h1>
          <p className="text-muted-foreground">
            {exercise.type.name} • {instances.length} étudiant(s)
          </p>
        </div>
        <ExportButton exercise={exercise} instances={instances} />
      </div>

      <ResultsStats stats={stats} />

      <ResultsTable instances={instances} />
    </div>
  );
}

function calculateStats(instances: any[]) {
  const total = instances.length;
  const withAttempts = instances.filter(i => i.attempts.length > 0).length;
  const successful = instances.filter(i => i.attempts.some((a: any) => a.is_correct)).length;

  const allAttempts = instances.flatMap(i => i.attempts);
  const totalAttempts = allAttempts.length;
  const avgAttempts = withAttempts > 0 ? totalAttempts / withAttempts : 0;

  return {
    total,
    withAttempts,
    successful,
    notAttempted: total - withAttempts,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    avgAttempts: Math.round(avgAttempts * 10) / 10,
    totalAttempts,
  };
}
```

### Results Stats (src/components/results/results-stats.tsx)
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle, XCircle, BarChart } from 'lucide-react';

interface ResultsStatsProps {
  stats: {
    total: number;
    withAttempts: number;
    successful: number;
    notAttempted: number;
    successRate: number;
    avgAttempts: number;
    totalAttempts: number;
  };
}

export function ResultsStats({ stats }: ResultsStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total étudiants</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.notAttempted} n'ont pas essayé
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {stats.successRate.toFixed(1)}%
          </div>
          <Progress value={stats.successRate} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Réussis / Échoués</CardTitle>
          <XCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <span className="text-green-500">{stats.successful}</span>
            {' / '}
            <span className="text-orange-500">{stats.withAttempts - stats.successful}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            sur {stats.withAttempts} ayant essayé
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tentatives</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAttempts}</div>
          <p className="text-xs text-muted-foreground">
            Moy. {stats.avgAttempts} par étudiant
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Results Table (src/components/results/results-table.tsx)
```typescript
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Instance {
  id: string;
  values: Record<string, number>;
  expected_answer: number;
  student: {
    id: string;
    full_name: string;
    email: string;
  };
  attempts: Array<{
    id: string;
    answer: number;
    is_correct: boolean;
    deviation: number;
    created_at: string;
  }>;
}

interface ResultsTableProps {
  instances: Instance[];
}

export function ResultsTable({ instances }: ResultsTableProps) {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'not_attempted'>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredInstances = instances.filter(instance => {
    const hasSuccess = instance.attempts.some(a => a.is_correct);
    const hasAttempts = instance.attempts.length > 0;

    switch (filter) {
      case 'success':
        return hasSuccess;
      case 'failed':
        return hasAttempts && !hasSuccess;
      case 'not_attempted':
        return !hasAttempts;
      default:
        return true;
    }
  });

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatus = (instance: Instance) => {
    if (instance.attempts.length === 0) {
      return { icon: Clock, color: 'text-gray-500', label: 'Non tenté' };
    }
    if (instance.attempts.some(a => a.is_correct)) {
      return { icon: CheckCircle, color: 'text-green-500', label: 'Réussi' };
    }
    return { icon: XCircle, color: 'text-orange-500', label: 'En cours' };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Détail par étudiant</h2>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous ({instances.length})</SelectItem>
            <SelectItem value="success">
              Réussis ({instances.filter(i => i.attempts.some(a => a.is_correct)).length})
            </SelectItem>
            <SelectItem value="failed">
              En cours ({instances.filter(i => i.attempts.length > 0 && !i.attempts.some(a => a.is_correct)).length})
            </SelectItem>
            <SelectItem value="not_attempted">
              Non tentés ({instances.filter(i => i.attempts.length === 0).length})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Étudiant</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Tentatives</TableHead>
            <TableHead>Réponse attendue</TableHead>
            <TableHead>Meilleure réponse</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInstances.map((instance) => {
            const status = getStatus(instance);
            const Icon = status.icon;
            const bestAttempt = instance.attempts
              .filter(a => a.is_correct)
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
              || instance.attempts.sort((a, b) => a.deviation - b.deviation)[0];
            const isExpanded = expandedRows.has(instance.id);

            return (
              <>
                <TableRow key={instance.id} className="cursor-pointer" onClick={() => toggleRow(instance.id)}>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{instance.student.full_name}</div>
                      <div className="text-sm text-muted-foreground">{instance.student.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${status.color}`} />
                      <span className={status.color}>{status.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>{instance.attempts.length}</TableCell>
                  <TableCell className="font-mono">{instance.expected_answer.toFixed(2)}</TableCell>
                  <TableCell>
                    {bestAttempt ? (
                      <div>
                        <span className="font-mono">{bestAttempt.answer.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({bestAttempt.deviation.toFixed(1)}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
                {isExpanded && instance.attempts.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/50">
                      <div className="p-4">
                        <h4 className="font-medium mb-2">Historique des tentatives</h4>
                        <div className="space-y-2">
                          {instance.attempts.map((attempt, idx) => (
                            <div
                              key={attempt.id}
                              className="flex items-center justify-between p-2 bg-white rounded"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">#{idx + 1}</span>
                                {attempt.is_correct ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="font-mono">{attempt.answer}</span>
                                <Badge variant={attempt.is_correct ? 'default' : 'secondary'}>
                                  {attempt.deviation.toFixed(2)}%
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(attempt.created_at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Export Button (src/components/results/export-button.tsx)
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  exercise: {
    title: string;
  };
  instances: Array<{
    student: {
      full_name: string;
      email: string;
    };
    expected_answer: number;
    attempts: Array<{
      answer: number;
      is_correct: boolean;
      deviation: number;
      created_at: string;
    }>;
  }>;
}

export function ExportButton({ exercise, instances }: ExportButtonProps) {
  const handleExport = () => {
    const headers = ['Nom', 'Email', 'Statut', 'Nb tentatives', 'Réponse attendue', 'Meilleure réponse', 'Écart (%)'];

    const rows = instances.map(instance => {
      const hasSuccess = instance.attempts.some(a => a.is_correct);
      const status = instance.attempts.length === 0 ? 'Non tenté' : hasSuccess ? 'Réussi' : 'En cours';
      const bestAttempt = instance.attempts.sort((a, b) => a.deviation - b.deviation)[0];

      return [
        instance.student.full_name,
        instance.student.email,
        status,
        instance.attempts.length,
        instance.expected_answer,
        bestAttempt?.answer || '',
        bestAttempt?.deviation.toFixed(2) || '',
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resultats-${exercise.title.replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Exporter CSV
    </Button>
  );
}
```

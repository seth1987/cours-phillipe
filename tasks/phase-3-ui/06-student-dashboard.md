# Tâche 18 - Dashboard Étudiant

## Contexte
Créer l'interface étudiant avec la liste des exercices disponibles, le détail d'un exercice et le formulaire de soumission.

## User Stories liées
- US-010 : Voir mes exercices disponibles
- US-011 : Résoudre MON exercice avec MES valeurs
- US-012 : Soumettre ma réponse et avoir un feedback immédiat
- US-013 : Réessayer si j'ai échoué

## Durée estimée
**4-5 heures**

## Requirements

### Checklist
- [ ] Page liste des exercices disponibles
- [ ] Card exercice avec statut (à faire, réussi, échoué)
- [ ] Page détail exercice avec énoncé personnalisé
- [ ] Formulaire de soumission de réponse
- [ ] Affichage du feedback (correct/incorrect)
- [ ] Historique des tentatives
- [ ] Affichage solution (si archivé et autorisé)

## Acceptance Criteria

1. ✅ L'étudiant voit uniquement les exercices de son prof
2. ✅ L'énoncé affiché contient ses valeurs personnalisées
3. ✅ La soumission donne un feedback immédiat
4. ✅ L'étudiant peut réessayer sans limite
5. ✅ L'historique des tentatives est visible

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/(protected)/student/page.tsx` | Create | Dashboard |
| `src/app/(protected)/student/exercices/[id]/page.tsx` | Create | Détail exercice |
| `src/components/student/exercise-card.tsx` | Create | Card exercice |
| `src/components/student/exercise-solver.tsx` | Create | Solveur |
| `src/components/student/answer-form.tsx` | Create | Formulaire réponse |
| `src/components/student/attempt-history.tsx` | Create | Historique |
| `src/components/student/feedback-display.tsx` | Create | Affichage feedback |

## Dependencies (blockers)
- ✅ Tâche 12 - Student Actions
- ✅ Tâche 13 - Layout

## Code Examples

### Dashboard Étudiant (src/app/(protected)/student/page.tsx)
```typescript
import { getStudentExercises } from '@/actions/students';
import { ExerciseCard } from '@/components/student/exercise-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export default async function StudentDashboard() {
  const { data: exercises, error } = await getStudentExercises();

  if (error) {
    return <div className="text-red-500">Erreur: {error}</div>;
  }

  const stats = {
    success: exercises?.filter(e => e.completionStatus === 'success').length || 0,
    attempted: exercises?.filter(e => e.completionStatus === 'attempted').length || 0,
    notStarted: exercises?.filter(e => e.completionStatus === 'not_started').length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes exercices</h1>
        <p className="text-muted-foreground">
          Exercices RDM à résoudre
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Réussis</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.success}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <XCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.attempted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">À faire</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notStarted}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exercises?.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>

      {exercises?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun exercice disponible pour le moment.
        </div>
      )}
    </div>
  );
}
```

### Exercise Card (src/components/student/exercise-card.tsx)
```typescript
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface ExerciseCardProps {
  exercise: {
    id: string;
    title: string;
    deadline: string | null;
    status: string;
    completionStatus: string;
    type: {
      name: string;
      category: string;
    };
  };
}

const statusConfig = {
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Réussi' },
  attempted: { icon: XCircle, color: 'text-orange-500', bg: 'bg-orange-50', label: 'En cours' },
  not_started: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50', label: 'À faire' },
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const config = statusConfig[exercise.completionStatus as keyof typeof statusConfig] || statusConfig.not_started;
  const Icon = config.icon;
  const isExpired = exercise.deadline && new Date(exercise.deadline) < new Date();
  const isArchived = exercise.status === 'archived';

  return (
    <Card className={config.bg}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{exercise.title}</CardTitle>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{exercise.type.name}</Badge>
          {isArchived && <Badge variant="secondary">Archivé</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {exercise.deadline ? (
            <span className={isExpired ? 'text-red-500' : ''}>
              {isExpired ? 'Expiré le' : 'Limite :'} {formatDate(exercise.deadline)}
            </span>
          ) : (
            <span>Pas de date limite</span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" disabled={isExpired && !isArchived}>
          <Link href={`/student/exercices/${exercise.id}`}>
            {exercise.completionStatus === 'success' ? 'Revoir' : 'Résoudre'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Page Exercice (src/app/(protected)/student/exercices/[id]/page.tsx)
```typescript
import { getStudentInstance } from '@/actions/students';
import { ExerciseSolver } from '@/components/student/exercise-solver';
import { redirect } from 'next/navigation';

export default async function ExercisePage({
  params,
}: {
  params: { id: string };
}) {
  const { data: instance, error } = await getStudentInstance(params.id);

  if (error || !instance) {
    redirect('/student');
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ExerciseSolver instance={instance} />
    </div>
  );
}
```

### Exercise Solver (src/components/student/exercise-solver.tsx)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AnswerForm } from './answer-form';
import { AttemptHistory } from './attempt-history';
import { FeedbackDisplay } from './feedback-display';
import { Latex } from '@/components/ui/latex';
import ReactMarkdown from 'react-markdown';

interface ExerciseSolverProps {
  instance: {
    id: string;
    statement_filled: string;
    values: Record<string, number>;
    exercise: {
      id: string;
      title: string;
      image_url: string | null;
      status: string;
      show_correction: boolean;
      solution: string | null;
      deadline: string | null;
      type: {
        name: string;
        result_unit: string;
      };
    };
  };
}

export function ExerciseSolver({ instance }: ExerciseSolverProps) {
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const exercise = instance.exercise;
  const isExpired = exercise.deadline && new Date(exercise.deadline) < new Date();
  const canSubmit = exercise.status === 'published' && !isExpired;
  const showSolution = exercise.status === 'archived' && exercise.show_correction;

  const handleSubmitResult = (result: { isCorrect: boolean; message: string }) => {
    setLastResult(result);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{exercise.title}</h1>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">{exercise.type.name}</Badge>
          {exercise.status === 'archived' && (
            <Badge variant="secondary">Archivé</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Énoncé</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ReactMarkdown>{instance.statement_filled}</ReactMarkdown>

          {exercise.image_url && (
            <img
              src={exercise.image_url}
              alt="Schéma de l'exercice"
              className="max-w-md mx-auto my-4"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vos valeurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(instance.values).map(([key, value]) => (
              <div key={key} className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{value}</div>
                <div className="text-sm text-muted-foreground">{key}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {lastResult && <FeedbackDisplay result={lastResult} />}

      {canSubmit ? (
        <Card>
          <CardHeader>
            <CardTitle>Votre réponse</CardTitle>
          </CardHeader>
          <CardContent>
            <AnswerForm
              instanceId={instance.id}
              resultUnit={exercise.type.result_unit}
              onSubmitResult={handleSubmitResult}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-orange-700">
              {isExpired
                ? 'La date limite est dépassée. Vous ne pouvez plus soumettre.'
                : 'Cet exercice est archivé et n\'accepte plus de soumissions.'}
            </p>
          </CardContent>
        </Card>
      )}

      {showSolution && exercise.solution && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Solution</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ReactMarkdown>{exercise.solution}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      <Separator />

      <AttemptHistory instanceId={instance.id} key={refreshKey} />
    </div>
  );
}
```

### Answer Form (src/components/student/answer-form.tsx)
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitAnswer } from '@/actions/attempts';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface AnswerFormProps {
  instanceId: string;
  resultUnit: string;
  onSubmitResult: (result: { isCorrect: boolean; message: string }) => void;
}

export function AnswerForm({ instanceId, resultUnit, onSubmitResult }: AnswerFormProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAnswer = parseFloat(answer);
    if (isNaN(numAnswer)) {
      toast.error('Veuillez entrer un nombre valide');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitAnswer({
        instanceId,
        answer: numAnswer,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      onSubmitResult({
        isCorrect: result.data.isCorrect,
        message: result.data.message,
      });

      if (result.data.isCorrect) {
        setAnswer('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="answer">Résultat numérique</Label>
        <div className="flex gap-2">
          <Input
            id="answer"
            type="number"
            step="any"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Entrez votre réponse"
            className="flex-1"
          />
          <span className="flex items-center px-3 bg-muted rounded-md text-sm">
            {resultUnit}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Entrez uniquement la valeur numérique (ex: 1875000 pour 1.875 MPa = 1875000 Pa)
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting || !answer}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Soumettre ma réponse
      </Button>
    </form>
  );
}
```

### Feedback Display (src/components/student/feedback-display.tsx)
```typescript
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

interface FeedbackDisplayProps {
  result: {
    isCorrect: boolean;
    message: string;
  };
}

export function FeedbackDisplay({ result }: FeedbackDisplayProps) {
  return (
    <Card className={result.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {result.isCorrect ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <XCircle className="h-8 w-8 text-red-500" />
          )}
          <div>
            <p className={`font-medium ${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {result.isCorrect ? 'Bravo !' : 'Pas encore...'}
            </p>
            <p className={`text-sm ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {result.message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Attempt History (src/components/student/attempt-history.tsx)
```typescript
import { getAttempts } from '@/actions/attempts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AttemptHistoryProps {
  instanceId: string;
}

export async function AttemptHistory({ instanceId }: AttemptHistoryProps) {
  const { data: attempts, error } = await getAttempts(instanceId);

  if (error || !attempts || attempts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique des tentatives</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                {attempt.is_correct ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <span className="font-mono">{attempt.answer}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    (écart: {attempt.deviation}%)
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(attempt.created_at)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Commands

```bash
# Installer react-markdown pour le rendu de l'énoncé
npm install react-markdown
```

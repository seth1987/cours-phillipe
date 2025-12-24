import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';

interface ExerciseInstance {
  id: string;
  completed: boolean;
  completed_at: string | null;
  exercises: {
    id: string;
    title: string;
    difficulty: string;
    rdm_types: {
      name: string;
    };
  };
}

async function getStudentExercises() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('exercise_instances')
    .select(`
      id,
      completed,
      completed_at,
      exercises (
        id,
        title,
        difficulty,
        rdm_types (name)
      )
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  return (data || []) as unknown as ExerciseInstance[];
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

const difficultyLabels: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

export default async function StudentDashboardPage() {
  const exercises = await getStudentExercises();
  const completed = exercises.filter(e => e.completed).length;
  const pending = exercises.filter(e => !e.completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes exercices</h1>
        <p className="text-muted-foreground">Liste de vos exercices assignés</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exercises.length}</div>
            <p className="text-xs text-muted-foreground">exercices assignés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Complétés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
            <p className="text-xs text-muted-foreground">exercices terminés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}</div>
            <p className="text-xs text-muted-foreground">exercices à faire</p>
          </CardContent>
        </Card>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun exercice assigné pour le moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exercises.map((instance) => (
            <Card key={instance.id} className={instance.completed ? 'opacity-75' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{instance.exercises.title}</CardTitle>
                  {instance.completed && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <CardDescription>{instance.exercises.rdm_types?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={difficultyColors[instance.exercises.difficulty]}>
                    {difficultyLabels[instance.exercises.difficulty]}
                  </Badge>
                </div>
                <Button
                  className="w-full"
                  variant={instance.completed ? 'outline' : 'default'}
                  asChild
                >
                  <Link href={`/etudiant/exercice/${instance.id}`}>
                    {instance.completed ? 'Voir le résultat' : 'Commencer'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

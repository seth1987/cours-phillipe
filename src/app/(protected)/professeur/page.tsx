import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Users, FileText, Plus } from 'lucide-react';

async function getStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { exercises: 0, students: 0, attempts: 0 };

  const [exercisesRes, studentsRes, attemptsRes] = await Promise.all([
    supabase.from('exercises').select('id', { count: 'exact' }).eq('prof_id', user.id),
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'etudiant'),
    supabase.from('attempts').select('id', { count: 'exact' }),
  ]);

  return {
    exercises: exercisesRes.count || 0,
    students: studentsRes.count || 0,
    attempts: attemptsRes.count || 0,
  };
}

export default async function ProfDashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue sur votre espace professeur</p>
        </div>
        <Button asChild>
          <Link href="/professeur/exercices/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel exercice
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exercices</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.exercises}</div>
            <p className="text-xs text-muted-foreground">exercices créés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Étudiants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
            <p className="text-xs text-muted-foreground">étudiants inscrits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tentatives</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attempts}</div>
            <p className="text-xs text-muted-foreground">réponses soumises</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/professeur/exercices">
                <FileText className="h-4 w-4 mr-2" />
                Voir tous les exercices
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/professeur/etudiants">
                <Users className="h-4 w-4 mr-2" />
                Gérer les étudiants
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/professeur/types">
                <BookOpen className="h-4 w-4 mr-2" />
                Types RDM
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dernière activité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aucune activité récente
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

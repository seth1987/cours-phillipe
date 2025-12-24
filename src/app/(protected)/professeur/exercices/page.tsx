import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';
import { StatusBadge } from '@/components/exercises/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Exercise {
  id: string;
  titre: string;
  statut: string;
  difficulty: string;
  created_at: string;
  rdm_types: {
    name: string;
  } | { name: string }[] | null;
}

async function getExercises() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('exercises')
    .select(`
      id,
      titre,
      statut,
      difficulty,
      created_at,
      rdm_types (name)
    `)
    .eq('prof_id', user.id)
    .order('created_at', { ascending: false });

  return (Array.isArray(data) ? data : []).map((ex: Record<string, unknown>) => ({
    ...ex,
    rdm_types: Array.isArray(ex.rdm_types) ? ex.rdm_types[0] : ex.rdm_types,
  })) as Exercise[];
}

const difficultyLabels: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

export default async function ExercicesPage() {
  const exercises = await getExercises();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mes exercices</h1>
          <p className="text-muted-foreground">Gérez vos exercices RDM</p>
        </div>
        <Button asChild>
          <Link href="/professeur/exercices/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel exercice
          </Link>
        </Button>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Vous n&apos;avez pas encore créé d&apos;exercice
            </p>
            <Button asChild>
              <Link href="/professeur/exercices/new">
                <Plus className="h-4 w-4 mr-2" />
                Créer mon premier exercice
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Liste des exercices</CardTitle>
            <CardDescription>{exercises.length} exercice(s) au total</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type RDM</TableHead>
                  <TableHead>Difficulté</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exercises.map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell className="font-medium">{exercise.titre}</TableCell>
                    <TableCell>{(exercise.rdm_types as { name: string } | null)?.name || '-'}</TableCell>
                    <TableCell>{difficultyLabels[exercise.difficulty]}</TableCell>
                    <TableCell>
                      <StatusBadge status={exercise.statut} />
                    </TableCell>
                    <TableCell>
                      {new Date(exercise.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/professeur/exercices/${exercise.id}`}>
                          Modifier
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

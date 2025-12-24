import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, FileText } from 'lucide-react';

interface AttemptHistory {
  id: string;
  given_answer: number;
  is_correct: boolean;
  deviation_percent: number;
  created_at: string;
  exercise_instances: {
    exercises: {
      title: string;
      rdm_types: {
        name: string;
      };
    };
  };
}

async function getHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('attempts')
    .select(`
      id,
      given_answer,
      is_correct,
      deviation_percent,
      created_at,
      exercise_instances (
        exercises (
          title,
          rdm_types (name)
        )
      )
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (data || []) as unknown as AttemptHistory[];
}

export default async function HistoriquePage() {
  const history = await getHistory();

  const stats = {
    total: history.length,
    correct: history.filter(h => h.is_correct).length,
    rate: history.length > 0
      ? ((history.filter(h => h.is_correct).length / history.length) * 100).toFixed(1)
      : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historique</h1>
        <p className="text-muted-foreground">Vos tentatives passées</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total tentatives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Réponses correctes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rate}%</div>
          </CardContent>
        </Card>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucune tentative enregistrée
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Dernières tentatives</CardTitle>
            <CardDescription>Les 50 dernières réponses soumises</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercice</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Réponse</TableHead>
                  <TableHead>Résultat</TableHead>
                  <TableHead>Écart</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">
                      {attempt.exercise_instances?.exercises?.title || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {attempt.exercise_instances?.exercises?.rdm_types?.name || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{attempt.given_answer}</TableCell>
                    <TableCell>
                      {attempt.is_correct ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>{attempt.deviation_percent.toFixed(2)}%</TableCell>
                    <TableCell>
                      {new Date(attempt.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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

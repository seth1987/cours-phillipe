'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Latex } from '@/components/ui/latex';
import { getStudentInstance } from '@/actions/students';
import { submitAnswers, getAttempts } from '@/actions/attempts';
import { Loader2, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ExpectedAnswer {
  name: string;
  value: number;
  unit: string;
  tolerance: number;
}

interface AnswerResult {
  name: string;
  unit: string;
  isCorrect: boolean;
  deviation: number;
  expectedAnswer: number;
  givenAnswer: number;
  tolerance: number;
}

interface ExerciseInstance {
  id: string;
  variable_values: Record<string, number>;
  statement_filled: string;
  completed: boolean;
  expected_answer: ExpectedAnswer[];
  final_answer: Array<{ name: string; value: number }> | null;
  exercises: {
    id: string;
    title: string;
    tolerance_percent: number;
    image_url: string | null;
    formulas: Array<{ name: string; formula: string; unit: string }>;
    expected_answers: Array<{ name: string; formula: string; unit: string; tolerance: number }> | null;
    rdm_types: { name: string; schema_svg?: string } | { name: string; schema_svg?: string }[] | null;
  } | null;
}

interface Attempt {
  id: string;
  given_answer: Array<{ name: string; value: number }>;
  is_correct: boolean;
  deviation_percent: number;
  answers_detail: AnswerResult[];
  created_at: string;
}

interface SubmitResult {
  all_correct: boolean;
  correct_count: number;
  total_count: number;
  results: AnswerResult[];
  message: string;
}

export default function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [instance, setInstance] = useState<ExerciseInstance | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmitResult | null>(null);

  const loadData = useCallback(async () => {
    const [instanceResult, attemptsResult] = await Promise.all([
      getStudentInstance(resolvedParams.id),
      getAttempts(resolvedParams.id),
    ]);

    if (instanceResult.error) {
      setError(instanceResult.error);
      setIsLoading(false);
      return;
    }

    const rawData = instanceResult.data as Record<string, unknown>;
    const exercises = Array.isArray(rawData.exercises) ? rawData.exercises[0] : rawData.exercises;
    const inst = {
      ...rawData,
      exercises: exercises as ExerciseInstance['exercises'],
    } as ExerciseInstance;

    setInstance(inst);
    setAttempts((attemptsResult.data || []) as Attempt[]);

    // Initialize answers state based on expected answers
    const expectedAnswers = inst.expected_answer || [];
    const initialAnswers: Record<string, string> = {};
    expectedAnswers.forEach((ea: ExpectedAnswer) => {
      initialAnswers[ea.name] = '';
    });
    setAnswers(initialAnswers);

    setIsLoading(false);
  }, [resolvedParams.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setIsSubmitting(true);

    // Validate and convert answers
    const expectedAnswers = instance?.expected_answer || [];
    const givenAnswers: Array<{ name: string; value: number }> = [];

    for (const ea of expectedAnswers) {
      const value = parseFloat(answers[ea.name]);
      if (isNaN(value)) {
        setError(`Veuillez entrer un nombre valide pour "${ea.name}"`);
        setIsSubmitting(false);
        return;
      }
      givenAnswers.push({ name: ea.name, value });
    }

    const submitResult = await submitAnswers({
      instance_id: resolvedParams.id,
      answers: givenAnswers,
    });

    if (submitResult.error) {
      setError(submitResult.error);
      setIsSubmitting(false);
      return;
    }

    const data = submitResult.data as SubmitResult | undefined;
    if (data) {
      setResult(data);

      if (data.all_correct) {
        setInstance((prev) => prev ? { ...prev, completed: true } : null);
      }
    }

    // Reset answers
    const resetAnswers: Record<string, string> = {};
    expectedAnswers.forEach((ea: ExpectedAnswer) => {
      resetAnswers[ea.name] = '';
    });
    setAnswers(resetAnswers);

    loadData();
    setIsSubmitting(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && !instance) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!instance) return null;

  const expectedAnswers = instance.expected_answer || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/etudiant">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{instance.exercises?.title}</h1>
          <p className="text-muted-foreground">
            {Array.isArray(instance.exercises?.rdm_types)
              ? instance.exercises?.rdm_types[0]?.name
              : instance.exercises?.rdm_types?.name}
          </p>
        </div>
        {instance.completed && (
          <CheckCircle className="h-6 w-6 text-green-500 ml-auto" />
        )}
      </div>

      {/* Affiche l'image uploadée OU le schéma SVG du type RDM */}
      {(instance.exercises?.image_url || (Array.isArray(instance.exercises?.rdm_types) ? instance.exercises?.rdm_types[0]?.schema_svg : instance.exercises?.rdm_types?.schema_svg)) && (
        <Card>
          <CardHeader>
            <CardTitle>Schéma de la structure</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {instance.exercises?.image_url ? (
              <Image
                src={instance.exercises.image_url}
                alt="Schéma de l'exercice"
                width={600}
                height={400}
                className="rounded-lg border object-contain max-h-[400px] w-auto"
              />
            ) : (
              <div
                className="w-full max-w-2xl bg-white p-4 rounded-lg border"
                dangerouslySetInnerHTML={{
                  __html: (Array.isArray(instance.exercises?.rdm_types)
                    ? instance.exercises?.rdm_types[0]?.schema_svg
                    : instance.exercises?.rdm_types?.schema_svg) || ''
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Énoncé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{instance.statement_filled}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formules à utiliser</CardTitle>
          <CardDescription>
            Utilisez ces formules pour calculer les réponses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(instance.exercises?.formulas || []).map((formula, index) => (
              <div key={index} className="flex items-center gap-4 p-2 bg-muted rounded">
                <span className="font-medium">{formula.name}:</span>
                <Latex formula={formula.formula} />
                <span className="text-muted-foreground">({formula.unit})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!instance.completed && (
        <Card>
          <CardHeader>
            <CardTitle>Vos réponses</CardTitle>
            <CardDescription>
              Entrez les valeurs calculées pour chaque grandeur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <Alert variant={result.all_correct ? 'default' : 'destructive'}>
                  {result.all_correct ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <div className="font-medium">{result.message}</div>
                    <div className="mt-2 space-y-1">
                      {result.results.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {r.isCorrect ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span>
                            {r.name}: {r.givenAnswer} {r.unit}
                            {!r.isCorrect && (
                              <span className="text-muted-foreground ml-1">
                                (écart {r.deviation.toFixed(2)}%, tolérance ±{r.tolerance}%)
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {expectedAnswers.map((ea) => (
                  <div key={ea.name} className="space-y-2">
                    <Label htmlFor={`answer-${ea.name}`}>
                      {ea.name} <span className="text-muted-foreground">({ea.unit})</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ±{ea.tolerance}%
                      </span>
                    </Label>
                    <Input
                      id={`answer-${ea.name}`}
                      type="number"
                      step="any"
                      value={answers[ea.name] || ''}
                      onChange={(e) => setAnswers({ ...answers, [ea.name]: e.target.value })}
                      placeholder="Ex: 125.5"
                      required
                    />
                  </div>
                ))}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Soumettre les réponses'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {instance.completed && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Exercice complété</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-green-700">
              <p className="font-medium mb-2">Réponses correctes:</p>
              <div className="space-y-1">
                {expectedAnswers.map((ea) => (
                  <div key={ea.name} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      {ea.name} = <strong>{ea.value}</strong> {ea.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des tentatives</CardTitle>
            <CardDescription>{attempts.length} tentative(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className={`p-4 rounded-lg ${
                    attempt.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Tentative #{attempts.length - index}</span>
                      {attempt.is_correct ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(attempt.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2 text-sm">
                    {(attempt.answers_detail || []).map((detail, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {detail.isCorrect ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span>
                          {detail.name}: {detail.givenAnswer} {detail.unit}
                          {!detail.isCorrect && (
                            <span className="text-muted-foreground">
                              {' '}(écart {detail.deviation.toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

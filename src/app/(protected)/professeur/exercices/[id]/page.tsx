'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/exercises/status-badge';
import { validateExercise, publishExercise, deleteExercise, archiveExercise } from '@/actions/exercises';
import { ArrowLeft, Trash2, CheckCircle, Globe, Save, Plus, X, Archive, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';

interface VariableRange {
  variable: string;
  min: number;
  max: number;
  step: number;
}

interface Exercise {
  id: string;
  titre: string;
  enonce: string;
  statut: string;
  difficulty: string;
  solution: string | null;
  plages: Record<string, { min: number; max: number; step?: number }>;
  formulas: Array<{ name: string; formula: string; unit: string }>;
  expected_answers: Array<{ name: string; formula: string; unit: string; tolerance: number }> | null;
  created_at: string;
  type_id: string | null;
  rdm_types: { name: string; schema_svg?: string } | null;
  deadline: string | null;
  show_correction_after_archive: boolean;
}

const difficultyLabels: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [titre, setTitre] = useState('');
  const [enonce, setEnonce] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [solution, setSolution] = useState('');
  const [variableRanges, setVariableRanges] = useState<VariableRange[]>([]);
  const [schemaSvg, setSchemaSvg] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string>('');
  const [showCorrection, setShowCorrection] = useState(false);

  useEffect(() => {
    async function fetchExercise() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          id,
          titre,
          enonce,
          statut,
          difficulty,
          solution,
          plages,
          formulas,
          expected_answers,
          created_at,
          type_id,
          deadline,
          show_correction_after_archive,
          rdm_types!type_id (name, schema_svg)
        `)
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching exercise:', error);
        setError('Exercice non trouve');
      } else {
        console.log('[DEBUG] Raw exercise data:', JSON.stringify(data, null, 2));
        console.log('[DEBUG] rdm_types raw:', data.rdm_types);
        const normalizedData = {
          ...data,
          rdm_types: Array.isArray(data.rdm_types) ? data.rdm_types[0] : data.rdm_types
        };
        console.log('[DEBUG] Normalized rdm_types:', normalizedData.rdm_types);
        console.log('[DEBUG] schema_svg exists:', !!normalizedData.rdm_types?.schema_svg);
        setExercise(normalizedData as Exercise);

        // Initialize form state
        setTitre(normalizedData.titre || '');
        setEnonce(normalizedData.enonce || '');
        setDifficulty(normalizedData.difficulty || 'medium');
        setSolution(normalizedData.solution || '');
        setSchemaSvg(normalizedData.rdm_types?.schema_svg || null);

        // Initialize deadline and correction options
        if (normalizedData.deadline) {
          setDeadline(new Date(normalizedData.deadline).toISOString().slice(0, 16));
        }
        setShowCorrection(normalizedData.show_correction_after_archive || false);

        // Convert plages to array
        if (normalizedData.plages) {
          const ranges = Object.entries(normalizedData.plages).map(([variable, config]) => ({
            variable,
            min: (config as { min: number }).min,
            max: (config as { max: number }).max,
            step: (config as { step?: number }).step || 1,
          }));
          setVariableRanges(ranges);
        }
      }
      setLoading(false);
    }

    if (params.id) {
      fetchExercise();
    }
  }, [params.id]);

  const handleSave = async () => {
    if (!exercise) return;
    setActionLoading(true);
    setError('');
    setSuccess('');

    const supabase = createClient();

    // Convert variableRanges back to object format
    const plages: Record<string, { min: number; max: number; step: number }> = {};
    variableRanges.forEach(v => {
      plages[v.variable] = { min: v.min, max: v.max, step: v.step };
    });

    const { error: updateError } = await supabase
      .from('exercises')
      .update({
        titre,
        enonce,
        difficulty,
        solution,
        plages,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        show_correction_after_archive: showCorrection,
      })
      .eq('id', exercise.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Exercice mis à jour avec succès');
      setExercise({
        ...exercise,
        titre,
        enonce,
        difficulty,
        solution,
        plages,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        show_correction_after_archive: showCorrection,
      });
      setIsEditing(false);
    }
    setActionLoading(false);
  };

  const handleValidate = async () => {
    if (!exercise) return;
    setActionLoading(true);
    setError('');
    const result = await validateExercise(exercise.id);
    if (result.error) {
      setError(result.error);
    } else {
      setExercise({ ...exercise, statut: 'valide' });
      setSuccess('Exercice valide');
    }
    setActionLoading(false);
  };

  const handlePublish = async () => {
    if (!exercise) return;
    setActionLoading(true);
    setError('');
    const result = await publishExercise(exercise.id);
    if (result.error) {
      setError(result.error);
    } else {
      setExercise({ ...exercise, statut: 'publie' });
      setSuccess('Exercice publie');
    }
    setActionLoading(false);
  };

  const handleArchive = async () => {
    if (!exercise) return;
    if (!confirm('Archiver cet exercice ? Il ne sera plus accessible aux étudiants.')) return;
    setActionLoading(true);
    setError('');
    const result = await archiveExercise(exercise.id);
    if (result.error) {
      setError(result.error);
    } else {
      setExercise({ ...exercise, statut: 'archive' });
      setSuccess('Exercice archivé');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!exercise) return;
    if (!confirm('Supprimer cet exercice ?')) return;
    setActionLoading(true);
    const result = await deleteExercise(exercise.id);
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/professeur/exercices');
    }
    setActionLoading(false);
  };

  const addVariable = () => {
    setVariableRanges([...variableRanges, { variable: '', min: 0, max: 10, step: 1 }]);
  };

  const removeVariable = (index: number) => {
    setVariableRanges(variableRanges.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: keyof VariableRange, value: string | number) => {
    const updated = [...variableRanges];
    updated[index] = { ...updated[index], [field]: value };
    setVariableRanges(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/professeur/exercices">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-red-500">
            {error || 'Exercice non trouve'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = exercise.statut === 'brouillon';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/professeur/exercices">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{exercise.titre}</h1>
            <p className="text-muted-foreground">
              {exercise.rdm_types?.name || 'Type non defini'} - {difficultyLabels[exercise.difficulty]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={exercise.statut} />
          {canEdit && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Modifier
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Schema SVG */}
      <Card>
        <CardHeader>
          <CardTitle>Schema</CardTitle>
        </CardHeader>
        <CardContent>
          {schemaSvg ? (
            <div
              className="bg-white p-4 rounded border max-w-md mx-auto"
              dangerouslySetInnerHTML={{ __html: schemaSvg }}
            />
          ) : (
            <p className="text-muted-foreground text-center">
              Aucun schéma disponible pour le type &quot;{exercise.rdm_types?.name || 'Non défini'}&quot;
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Titre */}
        <Card>
          <CardHeader>
            <CardTitle>Titre</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Titre de l'exercice"
              />
            ) : (
              <p>{exercise.titre}</p>
            )}
          </CardContent>
        </Card>

        {/* Difficulte */}
        <Card>
          <CardHeader>
            <CardTitle>Difficulte</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="easy">Facile</option>
                <option value="medium">Moyen</option>
                <option value="hard">Difficile</option>
              </select>
            ) : (
              <p>{difficultyLabels[exercise.difficulty]}</p>
            )}
          </CardContent>
        </Card>

        {/* Enonce */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Enonce</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={enonce}
                onChange={(e) => setEnonce(e.target.value)}
                placeholder="Enonce de l'exercice avec {variables}"
                rows={6}
              />
            ) : (
              <p className="whitespace-pre-wrap">{exercise.enonce}</p>
            )}
          </CardContent>
        </Card>

        {/* Variables */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Variables</CardTitle>
            <CardDescription>Plages de valeurs pour chaque variable</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {variableRanges.map((v, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={v.variable}
                      onChange={(e) => updateVariable(index, 'variable', e.target.value)}
                      placeholder="Nom"
                      className="w-24"
                    />
                    <Label className="text-sm">Min:</Label>
                    <Input
                      type="number"
                      value={v.min}
                      onChange={(e) => updateVariable(index, 'min', Number(e.target.value))}
                      className="w-20"
                    />
                    <Label className="text-sm">Max:</Label>
                    <Input
                      type="number"
                      value={v.max}
                      onChange={(e) => updateVariable(index, 'max', Number(e.target.value))}
                      className="w-20"
                    />
                    <Label className="text-sm">Pas:</Label>
                    <Input
                      type="number"
                      value={v.step}
                      onChange={(e) => updateVariable(index, 'step', Number(e.target.value))}
                      className="w-20"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeVariable(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addVariable}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter variable
                </Button>
              </div>
            ) : (
              variableRanges.length > 0 ? (
                <ul className="space-y-2">
                  {variableRanges.map((v, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="font-mono">{v.variable}</span>
                      <span className="text-muted-foreground">
                        [{v.min} - {v.max}] pas: {v.step}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Aucune variable definie</p>
              )
            )}
          </CardContent>
        </Card>

        {/* Solution */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Solution</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Solution detaillee..."
                rows={8}
              />
            ) : (
              exercise.solution ? (
                <p className="whitespace-pre-wrap font-mono text-sm">{exercise.solution}</p>
              ) : (
                <p className="text-muted-foreground">Aucune solution</p>
              )
            )}
          </CardContent>
        </Card>

        {/* Options d'archivage */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Options d&apos;archivage
            </CardTitle>
            <CardDescription>
              Configurez la date limite et l&apos;affichage de la correction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deadline">Date limite (optionnelle)</Label>
                {isEditing ? (
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                ) : (
                  <p className="text-sm">
                    {exercise.deadline
                      ? new Date(exercise.deadline).toLocaleString('fr-FR')
                      : 'Aucune date limite'}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  L&apos;exercice sera archivé automatiquement après cette date
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Afficher la correction après archivage
                </Label>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showCorrection"
                      checked={showCorrection}
                      onChange={(e) => setShowCorrection(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="showCorrection" className="text-sm font-normal">
                      Oui, montrer la solution aux étudiants
                    </Label>
                  </div>
                ) : (
                  <p className="text-sm">
                    {exercise.show_correction_after_archive
                      ? '✓ La correction sera visible après archivage'
                      : '✗ La correction restera masquée'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reponses attendues */}
        {exercise.expected_answers && exercise.expected_answers.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Reponses attendues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {exercise.expected_answers.map((answer, i) => (
                  <div key={i} className="border rounded p-3">
                    <div className="font-semibold">{answer.name}</div>
                    <div className="font-mono text-sm">{answer.formula}</div>
                    <div className="text-muted-foreground text-xs">
                      {answer.unit} (tolerance: {answer.tolerance}%)
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Gerez le cycle de vie de cet exercice</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          {isEditing && (
            <>
              <Button onClick={handleSave} disabled={actionLoading}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={actionLoading}>
                Annuler
              </Button>
            </>
          )}
          {!isEditing && exercise.statut === 'brouillon' && (
            <>
              <Button onClick={handleValidate} disabled={actionLoading}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Valider
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </>
          )}
          {!isEditing && exercise.statut === 'valide' && (
            <Button onClick={handlePublish} disabled={actionLoading}>
              <Globe className="h-4 w-4 mr-2" />
              Publier
            </Button>
          )}
          {exercise.statut === 'publie' && (
            <>
              <p className="text-green-600">Cet exercice est publié et visible par les étudiants.</p>
              <Button variant="outline" onClick={handleArchive} disabled={actionLoading}>
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </Button>
            </>
          )}
          {exercise.statut === 'archive' && (
            <p className="text-muted-foreground">Cet exercice est archivé et n&apos;est plus accessible aux étudiants.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

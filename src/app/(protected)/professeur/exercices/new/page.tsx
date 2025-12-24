'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createExercise } from '@/actions/exercises';
import { generateExercise } from '@/actions/gemini';
import { getRdmTypes, RdmType } from '@/actions/rdm-types';
import { uploadExerciseImage, deleteExerciseImage } from '@/actions/storage';
import { Loader2, AlertCircle, ArrowLeft, Wand2, Upload, X, Plus, Trash2, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface VariableRange {
  variable: string;
  min: number;
  max: number;
  step: number;
}

interface FormulaConfig {
  name: string;
  formula: string;
  unit: string;
}

interface ExpectedAnswerConfig {
  name: string;
  formula: string;
  unit: string;
  tolerance: number;
}

export default function NewExercisePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Types RDM loaded from database
  const [rdmTypes, setRdmTypes] = useState<RdmType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // Basic info
  const [title, setTitle] = useState('');
  const [rdmType, setRdmType] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [tolerancePercent, setTolerancePercent] = useState('5');

  // Content
  const [statementTemplate, setStatementTemplate] = useState('');
  const [solution, setSolution] = useState('');

  // Image
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [useCustomImage, setUseCustomImage] = useState(false);

  // Visual tables (no more JSON!)
  const [variableRanges, setVariableRanges] = useState<VariableRange[]>([
    { variable: '', min: 0, max: 100, step: 1 }
  ]);
  const [formulas, setFormulas] = useState<FormulaConfig[]>([
    { name: '', formula: '', unit: '' }
  ]);
  const [expectedAnswers, setExpectedAnswers] = useState<ExpectedAnswerConfig[]>([
    { name: '', formula: '', unit: '', tolerance: 5 }
  ]);

  // Load RDM types from database on mount
  useEffect(() => {
    async function loadTypes() {
      const result = await getRdmTypes();
      if (result.data) {
        setRdmTypes(result.data);
      }
      setIsLoadingTypes(false);
    }
    loadTypes();
  }, []);

  // Get selected type object
  const selectedType = rdmTypes.find(t => t.slug === rdmType);

  // Variable ranges handlers
  const addVariableRange = () => {
    setVariableRanges([...variableRanges, { variable: '', min: 0, max: 100, step: 1 }]);
  };

  const removeVariableRange = (index: number) => {
    if (variableRanges.length > 1) {
      setVariableRanges(variableRanges.filter((_, i) => i !== index));
    }
  };

  const updateVariableRange = (index: number, field: keyof VariableRange, value: string | number) => {
    const updated = [...variableRanges];
    if (field === 'variable') {
      updated[index] = { ...updated[index], [field]: value as string };
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) };
    }
    setVariableRanges(updated);
  };

  // Formulas handlers
  const addFormula = () => {
    setFormulas([...formulas, { name: '', formula: '', unit: '' }]);
  };

  const removeFormula = (index: number) => {
    if (formulas.length > 1) {
      setFormulas(formulas.filter((_, i) => i !== index));
    }
  };

  const updateFormula = (index: number, field: keyof FormulaConfig, value: string) => {
    const updated = [...formulas];
    updated[index] = { ...updated[index], [field]: value };
    setFormulas(updated);
  };

  // Expected answers handlers
  const addExpectedAnswer = () => {
    setExpectedAnswers([...expectedAnswers, { name: '', formula: '', unit: '', tolerance: 5 }]);
  };

  const removeExpectedAnswer = (index: number) => {
    if (expectedAnswers.length > 1) {
      setExpectedAnswers(expectedAnswers.filter((_, i) => i !== index));
    }
  };

  const updateExpectedAnswer = (index: number, field: keyof ExpectedAnswerConfig, value: string | number) => {
    const updated = [...expectedAnswers];
    updated[index] = { ...updated[index], [field]: value };
    setExpectedAnswers(updated);
  };

  // Image handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadExerciseImage(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setImageUrl(result.data.url);
        setImagePath(result.data.path);
        setUseCustomImage(true);
      }
    } catch {
      setError("Erreur lors de l&apos;upload de l&apos;image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageDelete = async () => {
    if (!imagePath) return;

    try {
      await deleteExerciseImage(imagePath);
      setImageUrl(null);
      setImagePath(null);
      setUseCustomImage(false);
    } catch {
      setError("Erreur lors de la suppression de l&apos;image");
    }
  };

  // AI Generation - fills ALL fields!
  const handleGenerateAI = async () => {
    if (!rdmType || !selectedType) {
      setError("Sélectionnez un type RDM avant de générer avec l&apos;IA");
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsGenerating(true);

    try {
      const result = await generateExercise({
        typeName: selectedType.name,
        variables: Array.isArray(selectedType.variables) ? selectedType.variables : [],
        formulas: Array.isArray(selectedType.formulas) ? selectedType.formulas : [],
        context: title || 'exercice de niveau universitaire',
        typeSlug: rdmType,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        // Update title if empty
        if (!title) {
          setTitle(`Exercice ${selectedType.name}`);
        }

        // Update statement (new field name: enonce)
        setStatementTemplate(result.data.enonce);

        // Update solution
        if (result.data.solution) {
          setSolution(result.data.solution);
        }

        // Convert variables array to visual table format (new format: array instead of object)
        if (Array.isArray(result.data.variables) && result.data.variables.length > 0) {
          const newRanges: VariableRange[] = result.data.variables.map(v => ({
            variable: v.name,
            min: v.min,
            max: v.max,
            step: v.step || 1,
          }));
          setVariableRanges(newRanges);
        }

        // Convert formulas from AI response (new: AI generates formulas)
        if (Array.isArray(result.data.formulas) && result.data.formulas.length > 0) {
          const newFormulas: FormulaConfig[] = result.data.formulas.map(f => ({
            name: f.name,
            formula: f.formula,
            unit: f.unit || '-',
          }));
          setFormulas(newFormulas);
        } else if (Array.isArray(selectedType.formulas) && selectedType.formulas.length > 0) {
          // Fallback to type formulas if AI didn't provide any
          const newFormulas: FormulaConfig[] = selectedType.formulas.map(f => ({
            name: f.name,
            formula: f.latex,
            unit: '-',
          }));
          setFormulas(newFormulas);
        }

        // Convert expected answers from AI response (new format: objects with formula field)
        if (Array.isArray(result.data.expected_answers) && result.data.expected_answers.length > 0) {
          const newAnswers: ExpectedAnswerConfig[] = result.data.expected_answers.map(a => ({
            name: a.name,
            formula: a.formula,
            unit: a.unit || 'kN ou kN.m',
            tolerance: a.tolerance || 5,
          }));
          setExpectedAnswers(newAnswers);
        }

        setSuccessMessage('Exercice généré avec succès ! Vérifiez et ajustez si nécessaire.');
      }
    } catch {
      setError('Erreur lors de la génération. Vérifiez votre clé API Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate required type selection
    if (!rdmType) {
      setError('Veuillez sélectionner un type RDM');
      setIsLoading(false);
      return;
    }

    console.log('[NEW-EXERCISE] Submitting with rdmType:', rdmType);
    console.log('[NEW-EXERCISE] selectedType:', selectedType);

    try {
      // Convert visual tables to the format expected by the API
      const formulasData = formulas.filter(f => f.name).map(f => ({
        name: f.name,
        formula: f.formula,
        unit: f.unit,
      }));

      const rangesData: Record<string, { min: number; max: number; step: number }> = {};
      variableRanges.filter(v => v.variable).forEach(v => {
        rangesData[v.variable] = {
          min: v.min,
          max: v.max,
          step: v.step,
        };
      });

      const validAnswers = expectedAnswers.filter(a => a.name);

      const result = await createExercise({
        title,
        rdm_type_slug: rdmType || undefined,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        statement_template: statementTemplate,
        formulas: formulasData,
        variable_ranges: rangesData,
        tolerance_percent: parseFloat(tolerancePercent),
        image_url: imageUrl || undefined,
        expected_answers: validAnswers.length > 0 ? validAnswers : undefined,
        solution: solution || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push(`/professeur/exercices/${result.data?.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/professeur/exercices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Nouvel exercice</h1>
          <p className="text-muted-foreground">Créez un nouvel exercice RDM</p>
        </div>
        <Button
          type="button"
          size="lg"
          disabled={isLoading || isGenerating || !rdmType}
          onClick={handleGenerateAI}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Générer avec IA
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <Sparkles className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>Définissez les paramètres de base de l&apos;exercice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l&apos;exercice</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Poutre encastrée avec charge répartie"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rdm_type">Type RDM</Label>
                <Select value={rdmType} onValueChange={setRdmType} disabled={isLoadingTypes}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingTypes ? "Chargement..." : "Sélectionnez un type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {rdmTypes.map((type) => (
                      <SelectItem key={type.id} value={type.slug || type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulté</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Facile</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="hard">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tolerance">Tolérance par défaut (%)</Label>
                <Input
                  id="tolerance"
                  type="number"
                  value={tolerancePercent}
                  onChange={(e) => setTolerancePercent(e.target.value)}
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schéma / Image */}
        <Card>
          <CardHeader>
            <CardTitle>Schéma de la structure</CardTitle>
            <CardDescription>
              {selectedType?.schema_svg
                ? "Schéma SVG du type sélectionné (ce que Gemini Vision analysera)"
                : "Sélectionnez un type RDM pour voir son schéma, ou uploadez une image personnalisée"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SVG Preview from selected type */}
            {selectedType?.schema_svg && !useCustomImage && (
              <div className="space-y-3">
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
                  <div
                    className="w-full max-w-xl mx-auto"
                    dangerouslySetInnerHTML={{ __html: selectedType.schema_svg }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Ce schéma sera envoyé à Gemini Vision pour générer un exercice cohérent
                </p>
              </div>
            )}

            {/* Custom image upload */}
            {(useCustomImage && imageUrl) ? (
              <div className="relative inline-block">
                <Image
                  src={imageUrl}
                  alt="Schéma personnalisé"
                  width={400}
                  height={300}
                  className="rounded-lg border object-contain max-h-[300px] w-auto"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleImageDelete}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {isUploading ? 'Upload en cours...' : 'Cliquez pour uploader une image personnalisée'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (Remplacera le schéma par défaut du type)
                  </span>
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Énoncé */}
        <Card>
          <CardHeader>
            <CardTitle>Énoncé</CardTitle>
            <CardDescription>
              Utilisez des variables entre accolades: {'{L}'}, {'{F}'}, {'{q}'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={statementTemplate}
              onChange={(e) => setStatementTemplate(e.target.value)}
              placeholder="Une poutre AB de longueur L = {L} m est encastrée en A et libre en B. Elle supporte une charge répartie q = {q} kN/m sur toute sa longueur..."
              rows={6}
              className="text-base"
            />
          </CardContent>
        </Card>

        {/* Plages de variables - TABLEAU VISUEL */}
        <Card>
          <CardHeader>
            <CardTitle>Plages de variables</CardTitle>
            <CardDescription>
              Définissez les valeurs min/max pour chaque variable de l&apos;énoncé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Variable</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Min</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Max</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Pas (step)</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {variableRanges.map((range, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">
                        <Input
                          value={range.variable}
                          onChange={(e) => updateVariableRange(index, 'variable', e.target.value)}
                          placeholder="L, F, q..."
                          className="font-mono"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          value={range.min}
                          onChange={(e) => updateVariableRange(index, 'min', e.target.value)}
                          step="any"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          value={range.max}
                          onChange={(e) => updateVariableRange(index, 'max', e.target.value)}
                          step="any"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          value={range.step}
                          onChange={(e) => updateVariableRange(index, 'step', e.target.value)}
                          step="any"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariableRange(index)}
                          disabled={variableRanges.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="outline" onClick={addVariableRange} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une variable
            </Button>
          </CardContent>
        </Card>

        {/* Formules de calcul - TABLEAU VISUEL */}
        <Card>
          <CardHeader>
            <CardTitle>Formules de calcul</CardTitle>
            <CardDescription>
              Les formules que l&apos;étudiant doit utiliser pour résoudre l&apos;exercice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Nom</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Formule</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Unité</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {formulas.map((formula, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">
                        <Input
                          value={formula.name}
                          onChange={(e) => updateFormula(index, 'name', e.target.value)}
                          placeholder="sigma, MA..."
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={formula.formula}
                          onChange={(e) => updateFormula(index, 'formula', e.target.value)}
                          placeholder="F / S, M × y / I..."
                          className="font-mono"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={formula.unit}
                          onChange={(e) => updateFormula(index, 'unit', e.target.value)}
                          placeholder="MPa, kN..."
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFormula(index)}
                          disabled={formulas.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="outline" onClick={addFormula} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une formule
            </Button>
          </CardContent>
        </Card>

        {/* Réponses attendues */}
        <Card>
          <CardHeader>
            <CardTitle>Réponses attendues</CardTitle>
            <CardDescription>
              Les valeurs que l&apos;étudiant doit calculer (réactions, moments, contraintes...)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Nom</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Formule de calcul</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Unité</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Tolérance %</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {expectedAnswers.map((answer, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">
                        <Input
                          value={answer.name}
                          onChange={(e) => updateExpectedAnswer(index, 'name', e.target.value)}
                          placeholder="XA, ZA, MA..."
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={answer.formula}
                          onChange={(e) => updateExpectedAnswer(index, 'formula', e.target.value)}
                          placeholder="q × L / 2"
                          className="font-mono"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={answer.unit}
                          onChange={(e) => updateExpectedAnswer(index, 'unit', e.target.value)}
                          placeholder="kN, kN.m"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          value={answer.tolerance}
                          onChange={(e) => updateExpectedAnswer(index, 'tolerance', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.5"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExpectedAnswer(index)}
                          disabled={expectedAnswers.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="outline" onClick={addExpectedAnswer} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une réponse attendue
            </Button>
          </CardContent>
        </Card>

        {/* Solution / Correction */}
        <Card>
          <CardHeader>
            <CardTitle>Solution / Correction</CardTitle>
            <CardDescription>
              La solution détaillée pour le professeur (non visible par les étudiants)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder={`1) Données et schéma
2) Équations d'équilibre:
   ΣFx = 0 → XA = 0
   ΣFz = 0 → ZA + ZB = q × L
   ΣM/A = 0 → ZB × L = q × L × L/2
3) Résolution:
   ZB = q × L / 2
   ZA = q × L / 2
4) Vérification...`}
              rows={8}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Submit buttons */}
        <div className="flex gap-4 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isLoading || isGenerating || !rdmType}
            onClick={handleGenerateAI}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Regénérer avec IA
              </>
            )}
          </Button>
          <Button type="submit" size="lg" disabled={isLoading || isGenerating} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              "Créer l'exercice"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

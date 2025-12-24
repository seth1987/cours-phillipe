# Tâche 15 - Éditeur d'Exercice

## Contexte
Créer l'interface complète de création et modification d'exercice avec génération IA, configuration des plages et prévisualisation.

## User Stories liées
- US-002 : Générer un exercice avec l'IA
- US-003 : Modifier l'énoncé et les plages
- US-004 : Définir la tolérance de correction

## Durée estimée
**4-5 heures**

## Requirements

### Checklist
- [ ] Formulaire de génération IA (contexte)
- [ ] Affichage de l'énoncé généré avec markdown
- [ ] Éditeur d'énoncé (textarea avec preview)
- [ ] Configuration des plages par variable
- [ ] Slider pour la tolérance
- [ ] Prévisualisation avec valeurs exemple
- [ ] Boutons d'action (Sauvegarder, Valider)
- [ ] Gestion des états de chargement

## Acceptance Criteria

1. ✅ Le prof peut générer un énoncé via IA
2. ✅ Le prof peut modifier l'énoncé manuellement
3. ✅ Les plages sont configurables (min, max, mode, step)
4. ✅ La prévisualisation montre un exemple concret
5. ✅ La tolérance est réglable de 0.1% à 20%

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/(protected)/prof/exercices/nouveau/page.tsx` | Create | Page création |
| `src/app/(protected)/prof/exercices/[id]/edit/page.tsx` | Create | Page édition |
| `src/components/exercises/exercise-editor.tsx` | Create | Éditeur principal |
| `src/components/exercises/ai-generator-form.tsx` | Create | Formulaire IA |
| `src/components/exercises/range-config.tsx` | Create | Config plages |
| `src/components/exercises/exercise-preview.tsx` | Create | Prévisualisation |
| `src/components/exercises/tolerance-slider.tsx` | Create | Slider tolérance |

## Dependencies (blockers)
- ✅ Tâche 07 - Gemini Integration
- ✅ Tâche 11 - Exercise Actions
- ✅ Tâche 14 - Type Library

## Code Examples

### Page Nouveau (src/app/(protected)/prof/exercices/nouveau/page.tsx)
```typescript
import { getType } from '@/actions/types';
import { ExerciseEditor } from '@/components/exercises/exercise-editor';
import { redirect } from 'next/navigation';

export default async function NewExercisePage({
  searchParams,
}: {
  searchParams: { typeId?: string };
}) {
  if (!searchParams.typeId) {
    redirect('/prof/types');
  }

  const { data: type, error } = await getType(searchParams.typeId);

  if (error || !type) {
    redirect('/prof/types');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvel exercice</h1>
        <p className="text-muted-foreground">
          Type : {type.name}
        </p>
      </div>

      <ExerciseEditor type={type} />
    </div>
  );
}
```

### Exercise Editor (src/components/exercises/exercise-editor.tsx)
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIGeneratorForm } from './ai-generator-form';
import { RangeConfig } from './range-config';
import { ExercisePreview } from './exercise-preview';
import { ToleranceSlider } from './tolerance-slider';
import { Textarea } from '@/components/ui/textarea';
import { createExercise, updateExercise, validateExercise } from '@/actions/exercises';
import { Loader2, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExerciseEditorProps {
  type: {
    id: string;
    name: string;
    variables: Array<{ symbol: string; name: string; unit: string }>;
    formulas: Array<{ name: string; code: string; latex: string; description: string }>;
  };
  exercise?: {
    id: string;
    statement: string;
    ranges: Record<string, RangeConfigType>;
    solution: string;
    tolerance: number;
    status: string;
  };
}

interface RangeConfigType {
  min: number;
  max: number;
  mode: 'libre' | 'palier';
  step?: number;
  decimals?: number;
}

export function ExerciseEditor({ type, exercise }: ExerciseEditorProps) {
  const router = useRouter();
  const [statement, setStatement] = useState(exercise?.statement || '');
  const [solution, setSolution] = useState(exercise?.solution || '');
  const [ranges, setRanges] = useState<Record<string, RangeConfigType>>(
    exercise?.ranges || initDefaultRanges(type.variables)
  );
  const [tolerance, setTolerance] = useState(exercise?.tolerance || 2);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleAIGenerated = (generated: { statement: string; solution: string; ranges: Record<string, RangeConfigType> }) => {
    setStatement(generated.statement);
    setSolution(generated.solution);
    setRanges({ ...ranges, ...generated.ranges });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = {
        typeId: type.id,
        statement,
        ranges,
        solution,
        tolerance,
      };

      const result = exercise
        ? await updateExercise({ id: exercise.id, ...data })
        : await createExercise(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Exercice sauvegardé');
      if (!exercise) {
        router.push(`/prof/exercices/${result.data.id}/edit`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!exercise) return;

    setIsValidating(true);
    try {
      const result = await validateExercise(exercise.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Exercice validé ! Vous pouvez maintenant le publier.');
      router.refresh();
    } finally {
      setIsValidating(false);
    }
  };

  const canValidate = exercise && exercise.status === 'draft' && statement && solution;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Génération IA</TabsTrigger>
          <TabsTrigger value="edit">Édition manuelle</TabsTrigger>
          <TabsTrigger value="preview">Prévisualisation</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <AIGeneratorForm
            type={type}
            onGenerated={handleAIGenerated}
          />
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Énoncé</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="L'énoncé de l'exercice. Utilisez {variable} pour les valeurs..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Variables disponibles : {type.variables.map(v => `{${v.symbol}}`).join(', ')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solution détaillée</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="La résolution étape par étape..."
                rows={6}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <ExercisePreview
            statement={statement}
            ranges={ranges}
            type={type}
          />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Configuration des plages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {type.variables.map((variable) => (
            <RangeConfig
              key={variable.symbol}
              variable={variable}
              config={ranges[variable.symbol]}
              onChange={(config) => setRanges({ ...ranges, [variable.symbol]: config })}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tolérance de correction</CardTitle>
        </CardHeader>
        <CardContent>
          <ToleranceSlider
            value={tolerance}
            onChange={setTolerance}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Sauvegarder brouillon
        </Button>

        {canValidate && (
          <Button
            onClick={handleValidate}
            disabled={isValidating}
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Valider l'exercice
          </Button>
        )}
      </div>
    </div>
  );
}

function initDefaultRanges(variables: Array<{ symbol: string }>): Record<string, RangeConfigType> {
  const ranges: Record<string, RangeConfigType> = {};
  for (const v of variables) {
    ranges[v.symbol] = {
      min: 1,
      max: 10,
      mode: 'libre',
      decimals: 1,
    };
  }
  return ranges;
}
```

### AI Generator Form (src/components/exercises/ai-generator-form.tsx)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { generateExercise } from '@/actions/gemini';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface AIGeneratorFormProps {
  type: {
    id: string;
    name: string;
    variables: Array<{ symbol: string; name: string; unit: string }>;
    formulas: Array<{ name: string; latex: string }>;
  };
  onGenerated: (data: { statement: string; solution: string; ranges: Record<string, any> }) => void;
}

export function AIGeneratorForm({ type, onGenerated }: AIGeneratorFormProps) {
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error('Veuillez décrire le contexte de l\'exercice');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateExercise({
        typeId: type.id,
        typeName: type.name,
        variables: type.variables,
        formulas: type.formulas,
        context,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      onGenerated(result.data);
      toast.success('Exercice généré avec succès !');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Génération par IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="context">Contexte de l'exercice</Label>
          <Textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Décrivez le contexte souhaité pour l'exercice...
Ex: Une poutre de pont autoroutier supportant des véhicules lourds"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            L'IA va générer un énoncé contextualisé avec les variables : {type.variables.map(v => v.name).join(', ')}
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer l'exercice
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Range Config (src/components/exercises/range-config.tsx)
```typescript
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RangeConfigProps {
  variable: {
    symbol: string;
    name: string;
    unit: string;
  };
  config: {
    min: number;
    max: number;
    mode: 'libre' | 'palier';
    step?: number;
    decimals?: number;
  };
  onChange: (config: RangeConfigProps['config']) => void;
}

export function RangeConfig({ variable, config, onChange }: RangeConfigProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <code className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
            {variable.symbol}
          </code>
          <span className="font-medium">{variable.name}</span>
          <span className="text-muted-foreground text-sm">({variable.unit})</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Min</Label>
            <Input
              type="number"
              value={config.min}
              onChange={(e) => onChange({ ...config, min: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Max</Label>
            <Input
              type="number"
              value={config.max}
              onChange={(e) => onChange({ ...config, max: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Mode</Label>
            <RadioGroup
              value={config.mode}
              onValueChange={(value) => onChange({ ...config, mode: value as 'libre' | 'palier' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="libre" id={`${variable.symbol}-libre`} />
                <Label htmlFor={`${variable.symbol}-libre`} className="text-sm">Libre</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="palier" id={`${variable.symbol}-palier`} />
                <Label htmlFor={`${variable.symbol}-palier`} className="text-sm">Palier</Label>
              </div>
            </RadioGroup>
          </div>

          {config.mode === 'palier' ? (
            <div className="space-y-2">
              <Label>Pas</Label>
              <Input
                type="number"
                value={config.step || 1}
                onChange={(e) => onChange({ ...config, step: Number(e.target.value) })}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Décimales</Label>
              <Input
                type="number"
                min={0}
                max={6}
                value={config.decimals || 1}
                onChange={(e) => onChange({ ...config, decimals: Number(e.target.value) })}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Tolerance Slider (src/components/exercises/tolerance-slider.tsx)
```typescript
'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ToleranceSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function ToleranceSlider({ value, onChange }: ToleranceSliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Tolérance acceptable</Label>
        <span className="text-2xl font-bold text-primary">±{value}%</span>
      </div>

      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0.1}
        max={20}
        step={0.1}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Strict (0.1%)</span>
        <span>Souple (20%)</span>
      </div>

      <p className="text-sm text-muted-foreground">
        Une réponse sera acceptée si elle est dans l'intervalle ±{value}% de la valeur attendue.
        <br />
        Recommandé : 2% pour les calculs RDM standard.
      </p>
    </div>
  );
}
```

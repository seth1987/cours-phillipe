# Tâche 07 - Intégration Google Gemini API

## Contexte
Configurer l'intégration avec l'API Google Gemini pour la génération automatique d'énoncés, de plages de valeurs et de résolutions détaillées.

## User Stories liées
- US-002 : En tant que Prof, je veux générer un exercice avec l'IA

## Durée estimée
**2-3 heures**

## Requirements

### Checklist
- [ ] Obtenir une clé API Gemini (gratuite)
- [ ] Installer le SDK Google Generative AI
- [ ] Créer le client Gemini
- [ ] Créer les templates de prompts
- [ ] Implémenter le parser de réponses JSON
- [ ] Créer la Server Action de génération
- [ ] Gérer les erreurs et rate limiting
- [ ] Tester avec différents types d'exercices

## Acceptance Criteria

1. ✅ L'API Gemini génère un énoncé contextualisé valide
2. ✅ Les plages de valeurs générées sont cohérentes physiquement
3. ✅ La résolution détaillée est pédagogique et correcte
4. ✅ Le JSON retourné est bien parsé sans erreur
5. ✅ Les erreurs API sont gérées gracieusement

## Technical Notes

### Modèle recommandé
- `gemini-1.5-flash` : Rapide, gratuit (1500 req/jour), bon pour génération texte

### Structure attendue du prompt
Le prompt doit inclure :
- Type d'exercice (nom, catégorie)
- Formules disponibles
- Variables avec unités
- Contexte souhaité (optionnel)

### Structure attendue de la réponse
```json
{
  "statement": "Énoncé avec {variables}...",
  "ranges": {
    "L": {"min": 2, "max": 8, "mode": "palier", "step": 0.5}
  },
  "solution": "Résolution étape par étape..."
}
```

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/lib/gemini/client.ts` | Create | Client Gemini configuré |
| `src/lib/gemini/prompts.ts` | Create | Templates de prompts |
| `src/lib/gemini/parser.ts` | Create | Parser réponses JSON |
| `src/actions/ai.ts` | Create | Server Actions IA |
| `.env.local` | Modify | Ajouter GEMINI_API_KEY |
| `.env.example` | Modify | Documenter la variable |

## Dependencies (blockers)
- ✅ Tâche 01 - Project Init

## Code Examples

### Client Gemini (src/lib/gemini/client.ts)
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  },
});

export async function generateContent(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Échec de la génération IA');
  }
}
```

### Prompts (src/lib/gemini/prompts.ts)
```typescript
import { ExerciseType } from '@/types/exercise';

export function buildExercisePrompt(
  type: ExerciseType,
  context?: string
): string {
  const formulas = type.formulas
    .map(f => `- ${f.name}: ${f.latex} (${f.description})`)
    .join('\n');

  const variables = type.variables
    .map(v => `- ${v.symbol} (${v.name}): unité ${v.unit}`)
    .join('\n');

  return `
Tu es un professeur de Résistance des Matériaux à l'université.
Génère un exercice basé sur le type suivant:

TYPE: ${type.name}
CATÉGORIE: ${type.category}

FORMULES DISPONIBLES:
${formulas}

VARIABLES:
${variables}

UNITÉ DU RÉSULTAT: ${type.result_unit}

${context ? `CONTEXTE SOUHAITÉ: ${context}` : 'CONTEXTE: Choisis un contexte réaliste (pont, bâtiment, machine, passerelle...)'}

Génère un JSON avec EXACTEMENT cette structure:
{
  "statement": "Énoncé contextualisé de l'exercice. Utilise les variables entre accolades comme {L}, {b}, {P}. L'énoncé doit faire 3-5 phrases et décrire une situation réaliste.",
  "ranges": {
    "VARIABLE": {"min": NUMBER, "max": NUMBER, "mode": "libre" | "palier", "step": NUMBER (si palier), "decimals": NUMBER (si libre)}
  },
  "solution": "Résolution détaillée étape par étape. Explique chaque calcul de manière pédagogique."
}

RÈGLES IMPORTANTES:
1. L'énoncé doit être réaliste et contextualisé (génie civil)
2. Les plages de valeurs doivent être physiquement cohérentes
3. La résolution doit être pédagogique avec chaque étape expliquée
4. Utilise des valeurs typiques du domaine (kN pour forces, m pour longueurs)
5. Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
6. Le JSON doit être valide et parsable
`.trim();
}
```

### Parser (src/lib/gemini/parser.ts)
```typescript
export interface GeneratedExercise {
  statement: string;
  ranges: Record<string, {
    min: number;
    max: number;
    mode: 'libre' | 'palier';
    step?: number;
    decimals?: number;
  }>;
  solution: string;
}

export function parseGeminiResponse(response: string): GeneratedExercise {
  // Nettoyer la réponse
  let cleaned = response.trim();

  // Enlever les balises markdown si présentes
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Validation
    if (!parsed.statement || typeof parsed.statement !== 'string') {
      throw new Error('statement manquant ou invalide');
    }
    if (!parsed.ranges || typeof parsed.ranges !== 'object') {
      throw new Error('ranges manquant ou invalide');
    }
    if (!parsed.solution || typeof parsed.solution !== 'string') {
      throw new Error('solution manquante ou invalide');
    }

    return parsed as GeneratedExercise;
  } catch (error) {
    console.error('Parse error:', error);
    console.error('Raw response:', response);
    throw new Error(`Échec du parsing de la réponse IA: ${error}`);
  }
}
```

### Server Action (src/actions/ai.ts)
```typescript
'use server';

import { generateContent } from '@/lib/gemini/client';
import { buildExercisePrompt } from '@/lib/gemini/prompts';
import { parseGeminiResponse, GeneratedExercise } from '@/lib/gemini/parser';
import { createClient } from '@/lib/supabase/server';

export async function generateExercise(
  typeId: string,
  context?: string
): Promise<{ data?: GeneratedExercise; error?: string }> {
  try {
    const supabase = await createClient();

    // Récupérer le type
    const { data: type, error: typeError } = await supabase
      .from('types')
      .select('*')
      .eq('id', typeId)
      .single();

    if (typeError || !type) {
      return { error: 'Type non trouvé' };
    }

    // Générer avec Gemini
    const prompt = buildExercisePrompt(type, context);
    const response = await generateContent(prompt);

    // Parser la réponse
    const generated = parseGeminiResponse(response);

    return { data: generated };
  } catch (error) {
    console.error('Generation error:', error);
    return { error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}
```

## Commands

```bash
# Installation SDK
npm install @google/generative-ai

# Configuration clé API
# 1. Aller sur https://aistudio.google.com
# 2. Get API Key > Create API Key
# 3. Copier dans .env.local:
echo "GEMINI_API_KEY=AIzaSy..." >> .env.local
```

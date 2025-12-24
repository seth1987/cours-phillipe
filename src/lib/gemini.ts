import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { svgToPngBase64, isValidSvg } from './svg-to-png';

// ============================================================
// VERSION TRACKING - Change this to confirm code is updated
// ============================================================
const GEMINI_LIB_VERSION = 'v3.0-debug-' + Date.now();

console.log('[GEMINI] ====================================');
console.log('[GEMINI] Library loaded - ' + GEMINI_LIB_VERSION);
console.log('[GEMINI] Running on:', typeof window === 'undefined' ? 'SERVER' : 'CLIENT');
console.log('[GEMINI] ====================================');

// Singleton instance - initialized once on first use
let genAIInstance: GoogleGenerativeAI | null = null;

/**
 * Get or create the GoogleGenerativeAI singleton instance.
 * Uses lazy initialization to ensure env var is read at runtime, not module load time.
 */
function getGenAI(): GoogleGenerativeAI {
  console.log('[GEMINI][' + GEMINI_LIB_VERSION + '] === getGenAI() called ===');
  console.log('[GEMINI] Current genAIInstance:', genAIInstance ? 'EXISTS' : 'NULL');
  console.log('[GEMINI] Running on:', typeof window === 'undefined' ? 'SERVER' : 'CLIENT');
  console.log('[GEMINI] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
  console.log('[GEMINI] GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);
  console.log('[GEMINI] GEMINI_API_KEY first 10 chars:', process.env.GEMINI_API_KEY?.substring(0, 10) || 'EMPTY');
  console.log('[GEMINI] All env keys containing GEMINI:', Object.keys(process.env).filter(k => k.includes('GEMINI')));

  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[GEMINI][' + GEMINI_LIB_VERSION + '] !!! GEMINI_API_KEY IS EMPTY OR UNDEFINED !!!');
      console.error('[GEMINI] process.env keys:', Object.keys(process.env).slice(0, 20));
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    console.log('[GEMINI][' + GEMINI_LIB_VERSION + '] Creating new GoogleGenerativeAI instance...');
    genAIInstance = new GoogleGenerativeAI(apiKey);
    console.log('[GEMINI][' + GEMINI_LIB_VERSION + '] Instance created successfully');
  } else {
    console.log('[GEMINI][' + GEMINI_LIB_VERSION + '] Reusing existing instance');
  }
  return genAIInstance;
}

export interface GenerateExerciseInput {
  typeName: string;
  variables: Array<{ symbol: string; name: string; unit: string }>;
  formulas: Array<{ name: string; latex: string; description: string }>;
  context: string;
  schemaSvg?: string;
}

export interface GeneratedExercise {
  enonce: string;
  variables: Array<{ name: string; min: number; max: number; step: number }>;
  formulas: Array<{ name: string; formula: string; unit: string }>;
  solution: string;
  expected_answers: Array<{ name: string; formula: string; unit: string; tolerance: number }>;
}

export async function generateExerciseWithAI(
  input: GenerateExerciseInput
): Promise<GeneratedExercise> {
  console.log('[GEMINI][' + GEMINI_LIB_VERSION + '] === generateExerciseWithAI() called ===');
  console.log('[GEMINI] Input typeName:', input.typeName);
  console.log('[GEMINI] Has schemaSvg:', !!input.schemaSvg);
  console.log('[GEMINI] schemaSvg length:', input.schemaSvg?.length || 0);

  const genAI = getGenAI();
  console.log('[GEMINI] Got genAI instance, getting model...');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('[GEMINI] Got model: gemini-2.0-flash');

  const variablesList = (Array.isArray(input.variables) ? input.variables : [])
    .map(v => `- ${v.symbol} (${v.name}) en ${v.unit}`)
    .join('\n');

  const _formulasList = (Array.isArray(input.formulas) ? input.formulas : [])
    .map(f => `- ${f.description}: ${f.latex}`)
    .join('\n');

  // Prompt amélioré avec règles strictes pour formules et expected_answers
  const typeName = input.typeName;
  const prompt = `Tu es un expert en Résistance des Matériaux (RDM). Tu dois générer un exercice pédagogique complet.

## STRUCTURE ANALYSÉE
Type: ${typeName}
Schéma: [Image fournie]

## VARIABLES AUTORISÉES (STRICTEMENT)
Tu ne peux utiliser QUE ces variables dans tes formules : ${variablesList || '(aucune variable définie)'}
❌ INTERDIT : Utiliser des variables non listées (q, F, P, M, etc. si non présentes)

## TA MISSION
Génère un exercice avec :
1. **Énoncé** : Problème clair utilisant {variable} pour chaque variable
2. **Variables** : Plages min/max/pas réalistes pour chaque variable
3. **Formules de référence** : Formules RDM utiles pour ce type de problème
4. **Solution** : Résolution complète étape par étape (équilibre statique, équations)
5. **Réponses attendues** : Les valeurs que l'étudiant doit calculer

## RÈGLE CRITIQUE - RÉPONSES ATTENDUES
⚠️ Le champ "formula" de chaque réponse attendue DOIT contenir EXACTEMENT l'expression mathématique finale de ta solution.

EXEMPLE :
Si ta solution calcule :
- "En appliquant l'équilibre : RA = E * alpha * deltaT"
- "Par symétrie : RB = -E * alpha * deltaT"

Alors expected_answers DOIT être :
[
  { "name": "RA", "formula": "E * alpha * deltaT", "unit": "N", "tolerance": 5 },
  { "name": "RB", "formula": "-E * alpha * deltaT", "unit": "N", "tolerance": 5 }
]

❌ INTERDIT : { "formula": "q × L / 2" } ou tout autre placeholder
✅ OBLIGATOIRE : La formula = l'expression finale de ta solution

## FORMAT JSON REQUIS
{
  "enonce": "Texte avec {variables} entre accolades",
  "variables": [
    { "name": "L", "min": 1, "max": 5, "step": 1 }
  ],
  "formulas": [
    { "name": "Contrainte thermique", "formula": "sigma = E * alpha * deltaT", "unit": "Pa" }
  ],
  "solution": "Résolution détaillée étape par étape...",
  "expected_answers": [
    { "name": "RA", "formula": "E * alpha * deltaT", "unit": "N", "tolerance": 5 }
  ]
}

## VÉRIFICATION FINALE
Avant de répondre, vérifie que :
✓ Chaque formula dans expected_answers apparaît dans ta solution
✓ Aucune variable non autorisée n'est utilisée
✓ Les formules sont des expressions calculables, pas des descriptions

Réponds UNIQUEMENT avec le JSON, sans texte autour.`;

  // Préparer le contenu pour Gemini (multimodal si schéma présent)
  let content: (string | Part)[];

  if (input.schemaSvg && isValidSvg(input.schemaSvg)) {
    try {
      // Convertir SVG en PNG base64 pour Vision
      const pngBase64 = await svgToPngBase64(input.schemaSvg);

      // Appel multimodal : texte + image
      content = [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/png',
            data: pngBase64
          }
        }
      ];

      console.log('[Gemini Vision] Schéma SVG converti en PNG et envoyé à Gemini');
    } catch (conversionError) {
      // Fallback en cas d'erreur de conversion : texte seul avec SVG brut
      console.warn('[Gemini] Erreur conversion SVG, fallback texte:', conversionError);
      content = [prompt + `\n\n## SVG BRUT DU SCHÉMA (si vous ne voyez pas l'image)\n\`\`\`svg\n${input.schemaSvg}\n\`\`\``];
    }
  } else {
    // Pas de schéma : texte seul
    content = [prompt];
  }

  const result = await model.generateContent(content);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Réponse IA invalide - JSON non trouvé');
  }

  return JSON.parse(jsonMatch[0]) as GeneratedExercise;
}

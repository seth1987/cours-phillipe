import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { svgToPngBase64, isValidSvg } from './svg-to-png';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GenerateExerciseInput {
  typeName: string;
  variables: Array<{ symbol: string; name: string; unit: string }>;
  formulas: Array<{ name: string; latex: string; description: string }>;
  context: string;
  schemaSvg?: string;
}

export interface GeneratedExercise {
  statement: string;
  solution: string;
  ranges: Record<string, { min: number; max: number; mode: 'libre' | 'palier'; step?: number; decimals?: number }>;
  expectedAnswers?: string[];
}

export async function generateExerciseWithAI(
  input: GenerateExerciseInput
): Promise<GeneratedExercise> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const variablesList = input.variables
    .map(v => `- ${v.symbol} (${v.name}) en ${v.unit}`)
    .join('\n');

  const formulasList = input.formulas
    .map(f => `- ${f.description}: ${f.latex}`)
    .join('\n');

  // Prompt avec instructions pour interpréter le schéma visuel
  const prompt = `Tu es professeur de Résistance des Matériaux (RDM) à l'Université de Bordeaux, département Génie Civil. Tu crées des exercices pour les TD de MS1 (isostatique) et MS2 (hyperstatique).

## CONTEXTE DE L'EXERCICE
Type: "${input.typeName}"
Description: "${input.context}"

${input.schemaSvg ? `## SCHÉMA DE LA STRUCTURE
**IMPORTANT** : Une image du schéma est jointe à cette requête. Analyse attentivement ce schéma visuel.

### Conventions graphiques à identifier dans le schéma :
- **Hachures (lignes parallèles diagonales)** = Encastrement (bloque X, Z et rotation M)
- **Triangle pointant vers le bas** = Appui simple (bloque Z uniquement)
- **Cercle avec base** = Articulation/Rotule (bloque X et Z)
- **Trait horizontal épais** = Poutre/barre
- **Flèches vers le bas (rouges)** = Forces ponctuelles
- **Flèches réparties avec "q"** = Charges réparties
- **Lettres (A, B, C...)** = Points caractéristiques de la structure

**MISSION** : L'exercice généré DOIT correspondre EXACTEMENT à la configuration géométrique visible dans le schéma. Identifie :
1. Les points d'appui et leur type (encastrement, appui simple, rotule)
2. Les points d'application des charges
3. La géométrie (longueurs, positions)
` : ''}

## CONNAISSANCES RDM REQUISES

### Types d'appuis et réactions associées
- Appui simple (rotule) : 1 réaction verticale (Z)
- Appui double (articulation) : 2 réactions (X, Z)
- Encastrement : 2 réactions + 1 moment (X, Z, M)
- Appui glissant : 1 réaction perpendiculaire au glissement

### Équations d'équilibre (structure isostatique)
- ΣFx = 0 (équilibre horizontal)
- ΣFz = 0 (équilibre vertical)
- ΣM/A = 0 (équilibre en rotation autour d'un point)

### Conventions
- Axe x horizontal vers la droite
- Axe z vertical vers le haut
- Moments positifs dans le sens trigonométrique (anti-horaire)
- Repère local de chaque tronçon = repère global

## CONFIGURATIONS STANDARDS

### Poutre sur 2 appuis (isostatique)
Points: A (appui double) --- B (appui simple)
Réponses: XA, ZA, ZB

### Poutre encastrée-libre (console)
Points: A (encastrement) --- B (libre)
Réponses: XA, ZA, MA

### Poutre encastrée + appui (hyperstatique degré 1)
Points: A (encastrement) --- B --- C (appui simple)
Réponses: XA, ZA, MA, ZC

### Portique simple
Points: A (encastrement) --- B (noeud) --- C (articulation)
Avec angle alpha pour les montants inclinés
Réponses: XA, ZA, MA, XC, ZC

## VARIABLES À UTILISER
${variablesList}

## FORMULES DISPONIBLES
${formulasList}

## RÈGLES DE GÉNÉRATION

1. ÉNONCÉ:
   - Décrire la géométrie clairement (points A, B, C, D)
   - Préciser chaque appui et son type
   - Indiquer où s'appliquent les charges
   - Utiliser {VARIABLE} pour les valeurs numériques
   - Terminer par "Calculer: XA, ZA, MA..." selon les appuis

2. SOLUTION:
   - Étape 1: Schéma et données
   - Étape 2: Équations d'équilibre
   - Étape 3: Résolution (avec formules littérales)
   - Étape 4: Vérification (somme des forces = 0)

3. PLAGES DE VALEURS:
   - Longueurs: min=2, max=10, step=0.5 ou 1
   - Forces: min=5, max=100, step=5 ou 10
   - Charges réparties: min=10, max=50, step=5
   - Angles: min=15, max=75, step=15

4. RÉPONSES ATTENDUES:
   - Lister TOUTES les inconnues à calculer
   - Cohérent avec les appuis décrits

## EXEMPLE D'EXERCICE ATTENDU

{
  "statement": "Une poutre ABC est encastrée en A et repose sur un appui simple en C. Le tronçon AB de longueur LAB = {LAB} m supporte une charge répartie q = {q} daN/m sur toute sa longueur. Le tronçon BC de longueur LBC = {LBC} m supporte une force ponctuelle F = {F} kN appliquée en son milieu. Déterminer les réactions en A (XA, ZA, MA) et en C (ZC).",
  "solution": "1) Données: LAB, LBC, q, F\\n2) Équilibre:\\n   ΣFx = 0 → XA = 0\\n   ΣFz = 0 → ZA + ZC = q×LAB + F\\n   ΣM/A = 0 → ZC×(LAB+LBC) = q×LAB×(LAB/2) + F×(LAB+LBC/2)\\n3) Résolution: ZC = ..., puis ZA = ...\\n4) Calcul MA par équilibre des moments",
  "ranges": {
    "LAB": {"min": 2, "max": 6, "mode": "palier", "step": 1},
    "LBC": {"min": 2, "max": 6, "mode": "palier", "step": 1},
    "q": {"min": 10, "max": 40, "mode": "palier", "step": 10},
    "F": {"min": 10, "max": 50, "mode": "palier", "step": 10}
  },
  "expectedAnswers": ["XA", "ZA", "MA", "ZC"]
}

## SORTIE
Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks, sans commentaires).`;

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

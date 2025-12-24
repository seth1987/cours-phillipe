# Tâche 08 - Calculateur de Formules RDM

## Contexte
Implémenter le système d'évaluation des formules mathématiques RDM pour calculer les réponses attendues à partir des valeurs des variables.

## User Stories liées
- US-011 : Variantes uniques par étudiant
- US-012 : Correction automatique

## Durée estimée
**2-3 heures**

## Requirements

### Checklist
- [ ] Installer la bibliothèque mathjs
- [ ] Créer l'évaluateur de formules
- [ ] Gérer les constantes (PI, etc.)
- [ ] Gérer le chaînage des formules (résultats intermédiaires)
- [ ] Créer des tests unitaires pour chaque type RDM
- [ ] Gérer les erreurs de calcul

## Acceptance Criteria

1. ✅ Les formules simples sont évaluées correctement (F/S)
2. ✅ Les formules avec puissances fonctionnent (b*h^3/12)
3. ✅ Le chaînage des formules fonctionne (Mf → I → sigma)
4. ✅ Les constantes mathématiques sont disponibles (PI)
5. ✅ Les tests passent pour tous les types RDM

## Technical Notes

### Bibliothèque mathjs
- Évaluation sécurisée d'expressions
- Support des fonctions mathématiques (pow, sqrt, etc.)
- Constantes intégrées (PI, E)

### Chaînage des formules
Les formules RDM sont souvent chaînées :
1. Calcul Mf (moment fléchissant)
2. Calcul I (moment d'inertie)
3. Calcul sigma = Mf * y / I (contrainte)

Le résultat de chaque formule devient une variable pour les suivantes.

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/lib/formulas/calculator.ts` | Create | Évaluateur formules |
| `src/lib/formulas/constants.ts` | Create | Constantes math |
| `tests/unit/calculator.test.ts` | Create | Tests unitaires |

## Dependencies (blockers)
- ✅ Tâche 01 - Project Init

## Code Examples

### Calculator (src/lib/formulas/calculator.ts)
```typescript
import { create, all, MathJsStatic } from 'mathjs';

// Créer une instance mathjs avec toutes les fonctions
const math: MathJsStatic = create(all);

// Constantes personnalisées
const constants = {
  PI: Math.PI,
  E: Math.E,
};

export interface FormulaDefinition {
  name: string;
  latex: string;
  code: string;
  description: string;
}

/**
 * Évalue une formule avec les variables données
 */
export function evaluateFormula(
  formula: string,
  variables: Record<string, number>
): number {
  try {
    // Combiner variables et constantes
    const scope = { ...constants, ...variables };

    // Évaluer l'expression
    const result = math.evaluate(formula, scope);

    // Convertir en nombre
    if (typeof result === 'number') {
      return result;
    }
    if (typeof result === 'object' && 'toNumber' in result) {
      return result.toNumber();
    }
    return Number(result);
  } catch (error) {
    throw new Error(`Erreur d'évaluation de la formule "${formula}": ${error}`);
  }
}

/**
 * Calcule le résultat final en chaînant toutes les formules
 */
export function calculateFinalAnswer(
  formulas: FormulaDefinition[],
  variables: Record<string, number>
): number {
  // Scope avec les variables initiales
  let scope = { ...variables };

  // Évaluer chaque formule dans l'ordre
  for (const formula of formulas) {
    const result = evaluateFormula(formula.code, scope);
    // Le résultat devient une variable pour les formules suivantes
    scope[formula.name] = result;
  }

  // Retourner le résultat de la dernière formule
  const lastFormula = formulas[formulas.length - 1];
  return scope[lastFormula.name];
}

/**
 * Calcule tous les résultats intermédiaires (pour affichage résolution)
 */
export function calculateAllSteps(
  formulas: FormulaDefinition[],
  variables: Record<string, number>
): Record<string, number> {
  const results: Record<string, number> = { ...variables };

  for (const formula of formulas) {
    const result = evaluateFormula(formula.code, results);
    results[formula.name] = result;
  }

  return results;
}

/**
 * Valide qu'une formule est syntaxiquement correcte
 */
export function validateFormula(formula: string): boolean {
  try {
    // Tester avec des valeurs fictives
    const testScope = {
      ...constants,
      a: 1, b: 1, c: 1, d: 1, e: 1, f: 1,
      L: 1, P: 1, h: 1, F: 1, S: 1, E: 1,
      Mt: 1, D: 1, alpha: 1, deltaT: 1,
      Mf: 1, I: 1, Ip: 1, sigma: 1, tau: 1,
    };
    math.evaluate(formula, testScope);
    return true;
  } catch {
    return false;
  }
}
```

### Tests (tests/unit/calculator.test.ts)
```typescript
import { describe, it, expect } from 'vitest';
import {
  evaluateFormula,
  calculateFinalAnswer,
  calculateAllSteps,
  validateFormula
} from '@/lib/formulas/calculator';

describe('Formula Calculator', () => {
  describe('evaluateFormula', () => {
    it('should evaluate simple division', () => {
      const result = evaluateFormula('F / S', { F: 1000, S: 0.01 });
      expect(result).toBe(100000); // 100 kPa
    });

    it('should evaluate multiplication', () => {
      const result = evaluateFormula('P * L', { P: 5000, L: 4 });
      expect(result).toBe(20000);
    });

    it('should evaluate power expressions', () => {
      const result = evaluateFormula('(b * h^3) / 12', { b: 0.2, h: 0.4 });
      expect(result).toBeCloseTo(0.001067, 5);
    });

    it('should use PI constant', () => {
      const result = evaluateFormula('(PI * d^4) / 32', { d: 0.1 });
      expect(result).toBeCloseTo(0.0000098175, 8);
    });

    it('should handle complex formulas', () => {
      const result = evaluateFormula('(PI * (D^4 - d^4)) / 32', { D: 0.1, d: 0.08 });
      expect(result).toBeCloseTo(0.0000058119, 8);
    });
  });

  describe('calculateFinalAnswer', () => {
    it('should calculate flexion bi-appuyée correctly', () => {
      const formulas = [
        { name: 'Mf', code: '(P * L) / 4', latex: '', description: '' },
        { name: 'I', code: '(b * h^3) / 12', latex: '', description: '' },
        { name: 'sigma', code: '(Mf * (h/2)) / I', latex: '', description: '' },
      ];
      const variables = { P: 10000, L: 4, b: 0.2, h: 0.4 };

      const result = calculateFinalAnswer(formulas, variables);

      // Mf = 10000 * 4 / 4 = 10000 N.m
      // I = 0.2 * 0.4^3 / 12 = 0.001067 m^4
      // sigma = 10000 * 0.2 / 0.001067 = 1875000 Pa
      expect(result).toBeCloseTo(1875000, -2);
    });

    it('should calculate torsion plein correctly', () => {
      const formulas = [
        { name: 'Ip', code: '(PI * pow(d, 4)) / 32', latex: '', description: '' },
        { name: 'tau', code: '(Mt * (d/2)) / Ip', latex: '', description: '' },
      ];
      const variables = { Mt: 500, d: 0.05 };

      const result = calculateFinalAnswer(formulas, variables);
      // Ip = PI * 0.05^4 / 32 = 6.136e-7
      // tau = 500 * 0.025 / 6.136e-7 = 20.37 MPa
      expect(result).toBeCloseTo(20371833, -3);
    });

    it('should calculate traction simple correctly', () => {
      const formulas = [
        { name: 'sigma', code: 'F / S', latex: '', description: '' },
      ];
      const variables = { F: 50000, S: 0.001 };

      const result = calculateFinalAnswer(formulas, variables);
      expect(result).toBe(50000000); // 50 MPa
    });
  });

  describe('calculateAllSteps', () => {
    it('should return all intermediate results', () => {
      const formulas = [
        { name: 'Mf', code: '(P * L) / 4', latex: '', description: '' },
        { name: 'I', code: '(b * h^3) / 12', latex: '', description: '' },
        { name: 'sigma', code: '(Mf * (h/2)) / I', latex: '', description: '' },
      ];
      const variables = { P: 10000, L: 4, b: 0.2, h: 0.4 };

      const results = calculateAllSteps(formulas, variables);

      expect(results.P).toBe(10000);
      expect(results.Mf).toBe(10000);
      expect(results.I).toBeCloseTo(0.001067, 5);
      expect(results.sigma).toBeCloseTo(1875000, -2);
    });
  });

  describe('validateFormula', () => {
    it('should validate correct formulas', () => {
      expect(validateFormula('F / S')).toBe(true);
      expect(validateFormula('(P * L) / 4')).toBe(true);
      expect(validateFormula('(b * h^3) / 12')).toBe(true);
      expect(validateFormula('PI * d^4 / 32')).toBe(true);
    });

    it('should reject invalid formulas', () => {
      expect(validateFormula('F /')).toBe(false);
      expect(validateFormula('((F * L)')).toBe(false);
    });
  });
});
```

## Commands

```bash
# Installation
npm install mathjs

# Types TypeScript
npm install -D @types/mathjs

# Lancer les tests
npm run test tests/unit/calculator.test.ts
```

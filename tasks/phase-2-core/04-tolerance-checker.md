# Tâche 10 - Vérificateur de Tolérance

## Contexte
Implémenter le système de vérification des réponses étudiants avec tolérance paramétrable pour accepter les arrondis et légères variations de calcul.

## User Stories liées
- US-004 : Définir la tolérance de correction
- US-012 : Soumettre ma réponse et avoir un feedback immédiat

## Durée estimée
**1 heure**

## Requirements

### Checklist
- [ ] Créer la fonction de vérification avec tolérance
- [ ] Calculer l'écart relatif en pourcentage
- [ ] Retourner un résultat détaillé
- [ ] Gérer les cas limites (division par zéro, etc.)
- [ ] Créer des tests unitaires

## Acceptance Criteria

1. ✅ Une réponse dans la tolérance est marquée correcte
2. ✅ Une réponse hors tolérance est marquée incorrecte
3. ✅ L'écart en % est calculé correctement
4. ✅ Les cas limites sont gérés (réponse = 0, etc.)

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/lib/utils/tolerance.ts` | Create | Vérificateur tolérance |
| `tests/unit/tolerance.test.ts` | Create | Tests unitaires |

## Dependencies (blockers)
- ✅ Tâche 01 - Project Init

## Code Examples

### Tolerance Checker (src/lib/utils/tolerance.ts)
```typescript
export interface ToleranceResult {
  isCorrect: boolean;
  deviation: number;      // Écart en pourcentage
  deviationAbsolute: number; // Écart absolu
  expectedAnswer: number;
  givenAnswer: number;
  tolerance: number;      // Tolérance utilisée
}

/**
 * Vérifie si une réponse est dans la tolérance acceptable
 *
 * @param givenAnswer - Réponse donnée par l'étudiant
 * @param expectedAnswer - Réponse attendue (calculée)
 * @param tolerancePercent - Tolérance en pourcentage (ex: 2 pour ±2%)
 */
export function checkAnswer(
  givenAnswer: number,
  expectedAnswer: number,
  tolerancePercent: number
): ToleranceResult {
  // Validation des inputs
  if (!isFinite(givenAnswer) || !isFinite(expectedAnswer)) {
    return {
      isCorrect: false,
      deviation: 100,
      deviationAbsolute: Math.abs(givenAnswer - expectedAnswer),
      expectedAnswer,
      givenAnswer,
      tolerance: tolerancePercent,
    };
  }

  // Cas spécial : réponse attendue = 0
  if (expectedAnswer === 0) {
    const isCorrect = givenAnswer === 0;
    return {
      isCorrect,
      deviation: isCorrect ? 0 : 100,
      deviationAbsolute: Math.abs(givenAnswer),
      expectedAnswer,
      givenAnswer,
      tolerance: tolerancePercent,
    };
  }

  // Calcul de l'écart relatif
  const deviationAbsolute = Math.abs(givenAnswer - expectedAnswer);
  const deviation = (deviationAbsolute / Math.abs(expectedAnswer)) * 100;

  // Arrondir à 2 décimales pour l'affichage
  const deviationRounded = Math.round(deviation * 100) / 100;

  return {
    isCorrect: deviation <= tolerancePercent,
    deviation: deviationRounded,
    deviationAbsolute: Math.round(deviationAbsolute * 1000000) / 1000000,
    expectedAnswer,
    givenAnswer,
    tolerance: tolerancePercent,
  };
}

/**
 * Formatte le résultat pour affichage utilisateur
 */
export function formatToleranceResult(result: ToleranceResult): string {
  if (result.isCorrect) {
    if (result.deviation === 0) {
      return 'Réponse exacte !';
    }
    return `Correct ! (écart de ${result.deviation}%, tolérance ±${result.tolerance}%)`;
  }

  return `Incorrect. Écart de ${result.deviation}% (tolérance ±${result.tolerance}%)`;
}

/**
 * Calcule la note sur 1 basée sur l'écart
 * (pour système de notation partielle future)
 */
export function calculatePartialScore(
  deviation: number,
  tolerance: number
): number {
  if (deviation <= tolerance) {
    return 1; // 100%
  }

  // Score décroissant linéairement jusqu'à 3x la tolérance
  const maxDeviation = tolerance * 3;
  if (deviation >= maxDeviation) {
    return 0;
  }

  return 1 - ((deviation - tolerance) / (maxDeviation - tolerance));
}
```

### Tests (tests/unit/tolerance.test.ts)
```typescript
import { describe, it, expect } from 'vitest';
import {
  checkAnswer,
  formatToleranceResult,
  calculatePartialScore
} from '@/lib/utils/tolerance';

describe('Tolerance Checker', () => {
  describe('checkAnswer', () => {
    it('should accept exact answer', () => {
      const result = checkAnswer(100, 100, 5);
      expect(result.isCorrect).toBe(true);
      expect(result.deviation).toBe(0);
    });

    it('should accept answer within tolerance', () => {
      // 102 vs 100 = 2% d'écart, tolérance 5%
      const result = checkAnswer(102, 100, 5);
      expect(result.isCorrect).toBe(true);
      expect(result.deviation).toBe(2);
    });

    it('should accept answer at tolerance boundary', () => {
      // 105 vs 100 = 5% d'écart, tolérance 5%
      const result = checkAnswer(105, 100, 5);
      expect(result.isCorrect).toBe(true);
      expect(result.deviation).toBe(5);
    });

    it('should reject answer outside tolerance', () => {
      // 110 vs 100 = 10% d'écart, tolérance 5%
      const result = checkAnswer(110, 100, 5);
      expect(result.isCorrect).toBe(false);
      expect(result.deviation).toBe(10);
    });

    it('should handle negative expected values', () => {
      // -98 vs -100 = 2% d'écart
      const result = checkAnswer(-98, -100, 5);
      expect(result.isCorrect).toBe(true);
      expect(result.deviation).toBe(2);
    });

    it('should handle very small numbers', () => {
      // 0.00102 vs 0.001 = 2% d'écart
      const result = checkAnswer(0.00102, 0.001, 5);
      expect(result.isCorrect).toBe(true);
      expect(result.deviation).toBe(2);
    });

    it('should handle very large numbers', () => {
      // 1020000 vs 1000000 = 2% d'écart
      const result = checkAnswer(1020000, 1000000, 5);
      expect(result.isCorrect).toBe(true);
      expect(result.deviation).toBe(2);
    });

    it('should handle expected = 0', () => {
      const result1 = checkAnswer(0, 0, 5);
      expect(result1.isCorrect).toBe(true);

      const result2 = checkAnswer(0.1, 0, 5);
      expect(result2.isCorrect).toBe(false);
    });

    it('should handle NaN and Infinity', () => {
      const result1 = checkAnswer(NaN, 100, 5);
      expect(result1.isCorrect).toBe(false);

      const result2 = checkAnswer(Infinity, 100, 5);
      expect(result2.isCorrect).toBe(false);
    });

    it('should return complete result object', () => {
      const result = checkAnswer(102, 100, 5);

      expect(result).toHaveProperty('isCorrect');
      expect(result).toHaveProperty('deviation');
      expect(result).toHaveProperty('deviationAbsolute');
      expect(result).toHaveProperty('expectedAnswer');
      expect(result).toHaveProperty('givenAnswer');
      expect(result).toHaveProperty('tolerance');

      expect(result.expectedAnswer).toBe(100);
      expect(result.givenAnswer).toBe(102);
      expect(result.tolerance).toBe(5);
      expect(result.deviationAbsolute).toBe(2);
    });
  });

  describe('formatToleranceResult', () => {
    it('should format exact answer', () => {
      const result = checkAnswer(100, 100, 5);
      const message = formatToleranceResult(result);
      expect(message).toContain('exacte');
    });

    it('should format correct answer with deviation', () => {
      const result = checkAnswer(102, 100, 5);
      const message = formatToleranceResult(result);
      expect(message).toContain('Correct');
      expect(message).toContain('2%');
    });

    it('should format incorrect answer', () => {
      const result = checkAnswer(110, 100, 5);
      const message = formatToleranceResult(result);
      expect(message).toContain('Incorrect');
      expect(message).toContain('10%');
    });
  });

  describe('calculatePartialScore', () => {
    it('should return 1 for answer within tolerance', () => {
      expect(calculatePartialScore(2, 5)).toBe(1);
      expect(calculatePartialScore(5, 5)).toBe(1);
    });

    it('should return 0 for answer way outside tolerance', () => {
      expect(calculatePartialScore(20, 5)).toBe(0);
    });

    it('should return partial score for moderate deviation', () => {
      // 10% d'écart avec tolérance 5% -> score partiel
      const score = calculatePartialScore(10, 5);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });
});
```

## Commands

```bash
# Lancer les tests
npm run test tests/unit/tolerance.test.ts
```

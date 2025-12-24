# Tâche 09 - Générateur de Variantes

## Contexte
Implémenter le système de génération de variantes uniques par étudiant. Chaque étudiant doit recevoir des valeurs différentes pour les variables, tout en restant dans les plages définies.

## User Stories liées
- US-005 : Publication génère variantes automatiquement
- US-011 : Résoudre MON exercice avec MES valeurs

## Durée estimée
**2 heures**

## Requirements

### Checklist
- [ ] Créer le générateur de valeurs aléatoires déterministes
- [ ] Supporter le mode "libre" (valeurs continues arrondies)
- [ ] Supporter le mode "palier" (valeurs discrètes)
- [ ] Garantir l'unicité des variantes par étudiant
- [ ] Créer la fonction de remplissage d'énoncé
- [ ] Créer des tests unitaires

## Acceptance Criteria

1. ✅ Un même étudiant reçoit toujours les mêmes valeurs (déterministe)
2. ✅ Deux étudiants différents reçoivent des valeurs différentes
3. ✅ Les valeurs respectent les plages min/max
4. ✅ Le mode "palier" génère des valeurs sur les pas définis
5. ✅ L'énoncé est correctement rempli avec les valeurs

## Technical Notes

### Génération déterministe
Utiliser un hash basé sur `exerciseId + studentId` pour générer un seed. Cela garantit :
- Reproductibilité : mêmes inputs → mêmes valeurs
- Unicité : inputs différents → valeurs différentes

### Modes de génération
- **libre** : Valeur continue dans [min, max], arrondie à N décimales
- **palier** : Valeur = min + k × step, où k est un entier aléatoire

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/lib/utils/variants.ts` | Create | Générateur variantes |
| `tests/unit/variants.test.ts` | Create | Tests unitaires |

## Dependencies (blockers)
- ✅ Tâche 01 - Project Init

## Code Examples

### Variant Generator (src/lib/utils/variants.ts)
```typescript
import { createHash } from 'crypto';

export interface RangeConfig {
  min: number;
  max: number;
  mode: 'libre' | 'palier';
  step?: number;
  decimals?: number;
}

/**
 * Génère un nombre pseudo-aléatoire à partir d'un seed string
 * Retourne un nombre entre 0 et 1
 */
function seededRandom(seed: string, index: number): number {
  const hash = createHash('sha256')
    .update(seed + index.toString())
    .digest('hex');
  // Utiliser les 8 premiers caractères hex
  return parseInt(hash.slice(0, 8), 16) / 0xffffffff;
}

/**
 * Génère les valeurs des variables pour une variante d'exercice
 */
export function generateVariantValues(
  ranges: Record<string, RangeConfig>,
  exerciseId: string,
  studentId: string
): Record<string, number> {
  const seed = `${exerciseId}-${studentId}`;
  const values: Record<string, number> = {};

  let index = 0;
  for (const [variable, config] of Object.entries(ranges)) {
    const random = seededRandom(seed, index);
    index++;

    let value: number;

    if (config.mode === 'palier' && config.step !== undefined) {
      // Mode palier : valeurs discrètes
      const numSteps = Math.floor((config.max - config.min) / config.step);
      const stepIndex = Math.floor(random * (numSteps + 1));
      value = config.min + stepIndex * config.step;
      // S'assurer qu'on ne dépasse pas max
      value = Math.min(value, config.max);
    } else {
      // Mode libre : valeur continue arrondie
      const rawValue = config.min + random * (config.max - config.min);
      const decimals = config.decimals ?? 1;
      const factor = Math.pow(10, decimals);
      value = Math.round(rawValue * factor) / factor;
    }

    values[variable] = value;
  }

  return values;
}

/**
 * Remplit l'énoncé avec les valeurs des variables
 */
export function fillStatement(
  template: string,
  values: Record<string, number>,
  units: Record<string, string>
): string {
  let filled = template;

  for (const [variable, value] of Object.entries(values)) {
    const unit = units[variable] || '';
    // Format: "4.5 m" ou "25 kN"
    const formattedValue = `**${value} ${unit}**`.trim();
    // Remplacer toutes les occurrences de {variable}
    const regex = new RegExp(`\\{${variable}\\}`, 'g');
    filled = filled.replace(regex, formattedValue);
  }

  return filled;
}

/**
 * Extrait les unités des variables depuis la définition du type
 */
export function extractUnits(
  variables: Array<{ symbol: string; unit: string }>
): Record<string, string> {
  const units: Record<string, string> = {};
  for (const v of variables) {
    units[v.symbol] = v.unit;
  }
  return units;
}

/**
 * Vérifie si deux sets de valeurs sont identiques
 */
export function areValuesEqual(
  values1: Record<string, number>,
  values2: Record<string, number>
): boolean {
  const keys1 = Object.keys(values1).sort();
  const keys2 = Object.keys(values2).sort();

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (values1[key] !== values2[key]) return false;
  }

  return true;
}
```

### Tests (tests/unit/variants.test.ts)
```typescript
import { describe, it, expect } from 'vitest';
import {
  generateVariantValues,
  fillStatement,
  areValuesEqual,
  RangeConfig
} from '@/lib/utils/variants';

describe('Variant Generator', () => {
  const sampleRanges: Record<string, RangeConfig> = {
    L: { min: 2, max: 8, mode: 'palier', step: 0.5 },
    P: { min: 5000, max: 50000, mode: 'palier', step: 5000 },
    b: { min: 0.1, max: 0.3, mode: 'libre', decimals: 2 },
    h: { min: 0.2, max: 0.5, mode: 'libre', decimals: 2 },
  };

  describe('generateVariantValues', () => {
    it('should generate values within ranges', () => {
      const values = generateVariantValues(
        sampleRanges,
        'exercise-1',
        'student-1'
      );

      expect(values.L).toBeGreaterThanOrEqual(2);
      expect(values.L).toBeLessThanOrEqual(8);
      expect(values.P).toBeGreaterThanOrEqual(5000);
      expect(values.P).toBeLessThanOrEqual(50000);
      expect(values.b).toBeGreaterThanOrEqual(0.1);
      expect(values.b).toBeLessThanOrEqual(0.3);
      expect(values.h).toBeGreaterThanOrEqual(0.2);
      expect(values.h).toBeLessThanOrEqual(0.5);
    });

    it('should generate deterministic values', () => {
      const values1 = generateVariantValues(
        sampleRanges,
        'exercise-1',
        'student-1'
      );
      const values2 = generateVariantValues(
        sampleRanges,
        'exercise-1',
        'student-1'
      );

      expect(values1).toEqual(values2);
    });

    it('should generate different values for different students', () => {
      const values1 = generateVariantValues(
        sampleRanges,
        'exercise-1',
        'student-1'
      );
      const values2 = generateVariantValues(
        sampleRanges,
        'exercise-1',
        'student-2'
      );

      expect(areValuesEqual(values1, values2)).toBe(false);
    });

    it('should respect step in palier mode', () => {
      const values = generateVariantValues(
        sampleRanges,
        'exercise-1',
        'student-1'
      );

      // L doit être un multiple de 0.5 dans [2, 8]
      const lSteps = (values.L - 2) / 0.5;
      expect(Number.isInteger(lSteps)).toBe(true);

      // P doit être un multiple de 5000 dans [5000, 50000]
      const pSteps = (values.P - 5000) / 5000;
      expect(Number.isInteger(pSteps)).toBe(true);
    });

    it('should respect decimals in libre mode', () => {
      const values = generateVariantValues(
        sampleRanges,
        'exercise-1',
        'student-1'
      );

      // b et h doivent avoir max 2 décimales
      const bDecimals = (values.b.toString().split('.')[1] || '').length;
      const hDecimals = (values.h.toString().split('.')[1] || '').length;

      expect(bDecimals).toBeLessThanOrEqual(2);
      expect(hDecimals).toBeLessThanOrEqual(2);
    });
  });

  describe('fillStatement', () => {
    it('should replace variables with values and units', () => {
      const template = 'Une poutre de longueur {L} supporte une charge de {P}.';
      const values = { L: 4.5, P: 25000 };
      const units = { L: 'm', P: 'N' };

      const filled = fillStatement(template, values, units);

      expect(filled).toContain('**4.5 m**');
      expect(filled).toContain('**25000 N**');
      expect(filled).not.toContain('{L}');
      expect(filled).not.toContain('{P}');
    });

    it('should handle multiple occurrences', () => {
      const template = 'La poutre a une longueur {L} et une section {b}×{h}. La longueur {L} est importante.';
      const values = { L: 4, b: 0.2, h: 0.4 };
      const units = { L: 'm', b: 'm', h: 'm' };

      const filled = fillStatement(template, values, units);

      // Compter les occurrences de "4 m"
      const matches = filled.match(/\*\*4 m\*\*/g);
      expect(matches?.length).toBe(2);
    });
  });

  describe('areValuesEqual', () => {
    it('should return true for identical values', () => {
      const v1 = { L: 4, P: 5000 };
      const v2 = { L: 4, P: 5000 };
      expect(areValuesEqual(v1, v2)).toBe(true);
    });

    it('should return false for different values', () => {
      const v1 = { L: 4, P: 5000 };
      const v2 = { L: 4.5, P: 5000 };
      expect(areValuesEqual(v1, v2)).toBe(false);
    });
  });
});
```

## Commands

```bash
# Lancer les tests
npm run test tests/unit/variants.test.ts
```

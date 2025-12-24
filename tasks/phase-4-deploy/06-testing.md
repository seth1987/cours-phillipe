# Tâche 25 - Tests et Qualité

## Contexte
Mettre en place les tests unitaires et d'intégration pour assurer la qualité du code.

## User Stories liées
- Qualité et maintenabilité

## Durée estimée
**3-4 heures**

## Requirements

### Checklist
- [ ] Configuration Vitest complète
- [ ] Tests unitaires pour les utilitaires
- [ ] Tests pour les Server Actions
- [ ] Tests des composants critiques
- [ ] Coverage report configuré
- [ ] CI avec tests automatiques

## Acceptance Criteria

1. ✅ Tests passent sans erreur
2. ✅ Coverage > 70% sur le code critique
3. ✅ CI bloque les PR si tests échouent

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `vitest.config.ts` | Create | Config Vitest |
| `tests/setup.ts` | Create | Setup tests |
| `tests/unit/*.test.ts` | Create | Tests unitaires |
| `.github/workflows/ci.yml` | Create | CI GitHub Actions |

## Dependencies (blockers)
- ✅ Tâche 01 - Project Init

## Code Examples

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/*',
      ],
    },
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Setup Tests (tests/setup.ts)
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock des variables d'environnement
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');

// Mock du client Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  })),
}));

// Mock de next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
```

### Tests Calculator (tests/unit/calculator.test.ts)
```typescript
import { describe, it, expect } from 'vitest';
import {
  evaluateFormula,
  calculateFinalAnswer,
  validateFormula,
} from '@/lib/formulas/calculator';

describe('Formula Calculator', () => {
  describe('evaluateFormula', () => {
    it('should evaluate simple division', () => {
      const result = evaluateFormula('F / S', { F: 1000, S: 0.01 });
      expect(result).toBe(100000);
    });

    it('should evaluate power expressions', () => {
      const result = evaluateFormula('(b * h^3) / 12', { b: 0.2, h: 0.4 });
      expect(result).toBeCloseTo(0.001067, 5);
    });

    it('should use PI constant', () => {
      const result = evaluateFormula('PI * r^2', { r: 1 });
      expect(result).toBeCloseTo(Math.PI, 10);
    });
  });

  describe('calculateFinalAnswer', () => {
    it('should chain formulas correctly', () => {
      const formulas = [
        { name: 'Mf', code: '(P * L) / 4', latex: '', description: '' },
        { name: 'I', code: '(b * h^3) / 12', latex: '', description: '' },
        { name: 'sigma', code: '(Mf * (h/2)) / I', latex: '', description: '' },
      ];
      const variables = { P: 10000, L: 4, b: 0.2, h: 0.4 };

      const result = calculateFinalAnswer(formulas, variables);
      expect(result).toBeCloseTo(1875000, -2);
    });
  });

  describe('validateFormula', () => {
    it('should validate correct formulas', () => {
      expect(validateFormula('F / S')).toBe(true);
      expect(validateFormula('(P * L) / 4')).toBe(true);
    });

    it('should reject invalid formulas', () => {
      expect(validateFormula('F /')).toBe(false);
      expect(validateFormula('((F * L)')).toBe(false);
    });
  });
});
```

### Tests Tolerance (tests/unit/tolerance.test.ts)
```typescript
import { describe, it, expect } from 'vitest';
import { checkAnswer, formatToleranceResult } from '@/lib/utils/tolerance';

describe('Tolerance Checker', () => {
  describe('checkAnswer', () => {
    it('should accept exact answer', () => {
      const result = checkAnswer(100, 100, 5);
      expect(result.isCorrect).toBe(true);
      expect(result.deviation).toBe(0);
    });

    it('should accept answer within tolerance', () => {
      const result = checkAnswer(102, 100, 5);
      expect(result.isCorrect).toBe(true);
      expect(result.deviation).toBe(2);
    });

    it('should reject answer outside tolerance', () => {
      const result = checkAnswer(110, 100, 5);
      expect(result.isCorrect).toBe(false);
      expect(result.deviation).toBe(10);
    });

    it('should handle expected = 0', () => {
      const result1 = checkAnswer(0, 0, 5);
      expect(result1.isCorrect).toBe(true);

      const result2 = checkAnswer(0.1, 0, 5);
      expect(result2.isCorrect).toBe(false);
    });
  });
});
```

### Tests Variants (tests/unit/variants.test.ts)
```typescript
import { describe, it, expect } from 'vitest';
import {
  generateVariantValues,
  fillStatement,
  areValuesEqual,
} from '@/lib/utils/variants';

describe('Variant Generator', () => {
  const sampleRanges = {
    L: { min: 2, max: 8, mode: 'palier' as const, step: 0.5 },
    P: { min: 5000, max: 50000, mode: 'palier' as const, step: 5000 },
  };

  describe('generateVariantValues', () => {
    it('should generate values within ranges', () => {
      const values = generateVariantValues(sampleRanges, 'ex-1', 'stu-1');

      expect(values.L).toBeGreaterThanOrEqual(2);
      expect(values.L).toBeLessThanOrEqual(8);
      expect(values.P).toBeGreaterThanOrEqual(5000);
      expect(values.P).toBeLessThanOrEqual(50000);
    });

    it('should be deterministic', () => {
      const values1 = generateVariantValues(sampleRanges, 'ex-1', 'stu-1');
      const values2 = generateVariantValues(sampleRanges, 'ex-1', 'stu-1');

      expect(values1).toEqual(values2);
    });

    it('should generate different values for different students', () => {
      const values1 = generateVariantValues(sampleRanges, 'ex-1', 'stu-1');
      const values2 = generateVariantValues(sampleRanges, 'ex-1', 'stu-2');

      expect(areValuesEqual(values1, values2)).toBe(false);
    });
  });

  describe('fillStatement', () => {
    it('should replace variables with values', () => {
      const template = 'Longueur {L} et charge {P}.';
      const values = { L: 4.5, P: 25000 };
      const units = { L: 'm', P: 'N' };

      const filled = fillStatement(template, values, units);

      expect(filled).toContain('**4.5 m**');
      expect(filled).toContain('**25000 N**');
    });
  });
});
```

### GitHub Actions CI (.github/workflows/ci.yml)
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run typecheck

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### Package.json - Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
```

## Commands

```bash
# Installer les dépendances de test
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @vitest/coverage-v8

# Lancer les tests
npm run test

# Lancer avec couverture
npm run test:coverage
```

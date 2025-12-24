import { create, all, MathJsInstance } from 'mathjs';

const math: MathJsInstance = create(all);

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

export function evaluateFormula(
  formula: string,
  variables: Record<string, number>
): number {
  try {
    const scope = { ...constants, ...variables };
    const result = math.evaluate(formula, scope);

    if (typeof result === 'number') return result;
    if (typeof result === 'object' && 'toNumber' in result) return result.toNumber();
    return Number(result);
  } catch (error) {
    throw new Error(`Erreur formule "${formula}": ${error}`);
  }
}

export function calculateFinalAnswer(
  formulas: FormulaDefinition[],
  variables: Record<string, number>
): number {
  const scope = { ...variables };

  for (const formula of formulas) {
    const result = evaluateFormula(formula.code, scope);
    scope[formula.name] = result;
  }

  const lastFormula = formulas[formulas.length - 1];
  return scope[lastFormula.name];
}

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

export function validateFormula(formula: string): boolean {
  try {
    const testScope = {
      ...constants,
      a: 1, b: 1, c: 1, d: 1, e: 1, f: 1,
      L: 1, P: 1, h: 1, F: 1, S: 1, E: 1,
      Mt: 1, D: 1, alpha: 1, deltaT: 1,
      Mf: 1, I: 1, Ip: 1, sigma: 1, tau: 1, y: 1, r: 1,
    };
    math.evaluate(formula, testScope);
    return true;
  } catch {
    return false;
  }
}

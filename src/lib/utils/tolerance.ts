export interface ToleranceResult {
  isCorrect: boolean;
  deviation: number;
  deviationAbsolute: number;
  expectedAnswer: number;
  givenAnswer: number;
  tolerance: number;
}

export interface ExpectedAnswer {
  name: string;
  value: number;
  unit: string;
  tolerance: number;
}

export interface GivenAnswer {
  name: string;
  value: number;
}

export interface MultipleAnswersResult {
  allCorrect: boolean;
  results: Array<ToleranceResult & { name: string; unit: string }>;
  correctCount: number;
  totalCount: number;
}

export function checkAnswer(
  givenAnswer: number,
  expectedAnswer: number,
  tolerancePercent: number
): ToleranceResult {
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

  const deviationAbsolute = Math.abs(givenAnswer - expectedAnswer);
  const deviation = (deviationAbsolute / Math.abs(expectedAnswer)) * 100;
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

export function checkMultipleAnswers(
  givenAnswers: GivenAnswer[],
  expectedAnswers: ExpectedAnswer[]
): MultipleAnswersResult {
  const results: MultipleAnswersResult['results'] = [];

  for (const expected of expectedAnswers) {
    const given = givenAnswers.find(g => g.name === expected.name);
    const givenValue = given?.value ?? NaN;

    const result = checkAnswer(givenValue, expected.value, expected.tolerance);
    results.push({
      ...result,
      name: expected.name,
      unit: expected.unit,
    });
  }

  const correctCount = results.filter(r => r.isCorrect).length;

  return {
    allCorrect: correctCount === expectedAnswers.length,
    results,
    correctCount,
    totalCount: expectedAnswers.length,
  };
}

export function formatToleranceResult(result: ToleranceResult): string {
  if (result.isCorrect) {
    if (result.deviation === 0) return 'Réponse exacte !';
    return `Correct ! (écart de ${result.deviation}%, tolérance ±${result.tolerance}%)`;
  }
  return `Incorrect. Écart de ${result.deviation}% (tolérance ±${result.tolerance}%)`;
}

export function formatMultipleAnswersResult(result: MultipleAnswersResult): string {
  if (result.allCorrect) {
    return `Toutes les réponses sont correctes ! (${result.correctCount}/${result.totalCount})`;
  }
  return `${result.correctCount}/${result.totalCount} réponses correctes`;
}

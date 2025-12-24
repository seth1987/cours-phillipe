import { createHash } from 'crypto';

export interface RangeConfig {
  min: number;
  max: number;
  mode: 'libre' | 'palier';
  step?: number;
  decimals?: number;
}

function seededRandom(seed: string, index: number): number {
  const hash = createHash('sha256')
    .update(seed + index.toString())
    .digest('hex');
  return parseInt(hash.slice(0, 8), 16) / 0xffffffff;
}

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
      const numSteps = Math.floor((config.max - config.min) / config.step);
      const stepIndex = Math.floor(random * (numSteps + 1));
      value = config.min + stepIndex * config.step;
      value = Math.min(value, config.max);
    } else {
      const rawValue = config.min + random * (config.max - config.min);
      const decimals = config.decimals ?? 1;
      const factor = Math.pow(10, decimals);
      value = Math.round(rawValue * factor) / factor;
    }

    values[variable] = value;
  }

  return values;
}

export function fillStatement(
  template: string,
  values: Record<string, number>,
  units: Record<string, string>
): string {
  let filled = template;

  for (const [variable, value] of Object.entries(values)) {
    const unit = units[variable] || '';
    const formattedValue = `**${value} ${unit}**`.trim();
    const regex = new RegExp(`\\{${variable}\\}`, 'g');
    filled = filled.replace(regex, formattedValue);
  }

  return filled;
}

export function extractUnits(
  variables: Array<{ symbol: string; unit: string }>
): Record<string, string> {
  const units: Record<string, string> = {};
  for (const v of variables) {
    units[v.symbol] = v.unit;
  }
  return units;
}

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

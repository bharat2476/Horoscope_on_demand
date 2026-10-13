import { type ComparisonRow } from '@/modules/panchang/compare';

const COLUMNS = [
  'caseId',
  'ruleId',
  'provider',
  'providerVersion',
  'field',
  'verdict',
  'differenceSeconds',
  'referenceValue',
  'providerValue',
  'detail',
] as const;

export function comparisonToCsv(rows: ComparisonRow[]): string {
  const lines = [COLUMNS.join(',')];
  for (const entry of rows) {
    lines.push(COLUMNS.map((column) => cell(entry[column])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function cell(value: string | number | null): string {
  if (value === null) {
    return '';
  }
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

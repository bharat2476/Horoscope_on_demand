import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { compareToReference, type ComparisonRow } from '../../src/modules/panchang/compare';
import { comparisonToCsv } from '../../src/modules/panchang/csv-report';
import { loadProviderResponses, loadReferenceCases } from './store';

export async function buildComparisonReport(
  referenceDirectory: string,
  responseDirectory: string,
): Promise<ComparisonRow[]> {
  const references = await loadReferenceCases(referenceDirectory);
  const responses = await loadProviderResponses(responseDirectory);
  const byCase = new Map(responses.map((response) => [response.caseId, response.record]));
  return references.flatMap((referenceCase) =>
    compareToReference(
      referenceCase.id,
      referenceCase.ruleId,
      referenceCase.record,
      byCase.get(referenceCase.id) ?? null,
    ),
  );
}

export async function writeComparisonReport(
  referenceDirectory: string,
  responseDirectory: string,
  outputFile: string,
): Promise<string> {
  const rows = await buildComparisonReport(referenceDirectory, responseDirectory);
  await mkdir(path.dirname(outputFile), { recursive: true });
  const csv = comparisonToCsv(rows);
  await writeFile(outputFile, csv, 'utf8');
  return csv;
}

const isDirectRun = process.argv[1]?.includes('run-compare');

if (isDirectRun) {
  const root = path.resolve('server/panchang');
  const output = path.join(root, 'out', 'comparison.csv');
  writeComparisonReport(path.join(root, 'reference'), path.join(root, 'responses'), output).catch(
    (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Comparison report failed.';
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    },
  );
}

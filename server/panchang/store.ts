import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { type NormalizedPanchang } from '../../src/modules/panchang/normalized';
import { parseNormalizedPanchang } from '../../src/modules/panchang/parse-record';

export type ReferenceApproval = 'pending' | 'approved';

export type ReferenceCase = {
  id: string;
  ruleId: string;
  approval: ReferenceApproval;
  notes: string;
  citation?: string;
  record: NormalizedPanchang;
};

export type StoredProviderResponse = {
  caseId: string;
  record: NormalizedPanchang;
};

export async function loadReferenceCases(directory: string): Promise<ReferenceCase[]> {
  const files = await jsonFiles(directory);
  const cases = await Promise.all(
    files.map(async (file) => parseReferenceCase(await readFile(file, 'utf8'), file)),
  );
  return cases.sort((left, right) => left.id.localeCompare(right.id));
}

export async function loadProviderResponses(directory: string): Promise<StoredProviderResponse[]> {
  const files = await jsonFiles(directory);
  const responses = await Promise.all(
    files.map(async (file) => parseProviderResponse(await readFile(file, 'utf8'), file)),
  );
  return responses.sort((left, right) => left.caseId.localeCompare(right.caseId));
}

export function parseReferenceCase(text: string, label: string): ReferenceCase {
  const value: unknown = JSON.parse(text);
  if (!isRecord(value)) {
    throw new Error(`${label} is not a reference case.`);
  }
  const id = requiredString(value, 'id', label);
  const ruleId = requiredString(value, 'ruleId', label);
  const approval = requiredString(value, 'approval', label);
  const notes = requiredString(value, 'notes', label);
  if (approval !== 'pending' && approval !== 'approved') {
    throw new Error(`${label} has an unknown approval state.`);
  }
  const parsed = parseNormalizedPanchang(value.record);
  if (!parsed.ok) {
    throw new Error(`${label} record is missing ${parsed.missing.join(', ')}.`);
  }
  const citation = typeof value.citation === 'string' ? value.citation : '';
  if (approval === 'pending' && parsed.record.result.status !== 'unavailable') {
    throw new Error(`${label} is pending and cannot store a calculated Panchang.`);
  }
  if (approval === 'approved' && parsed.record.result.status !== 'ok') {
    throw new Error(`${label} is approved but has no reference result.`);
  }
  if (approval === 'approved' && citation.trim().length === 0) {
    throw new Error(`${label} is approved without a citation.`);
  }
  return {
    id,
    ruleId,
    approval,
    notes,
    ...(citation ? { citation } : {}),
    record: parsed.record,
  };
}

export function parseProviderResponse(text: string, label: string): StoredProviderResponse {
  const value: unknown = JSON.parse(text);
  if (!isRecord(value)) {
    throw new Error(`${label} is not a provider response.`);
  }
  const caseId = requiredString(value, 'caseId', label);
  const parsed = parseNormalizedPanchang(value.record);
  if (!parsed.ok) {
    throw new Error(`${label} record is missing ${parsed.missing.join(', ')}.`);
  }
  return { caseId, record: parsed.record };
}

async function jsonFiles(directory: string): Promise<string[]> {
  let names: string[];
  try {
    names = await readdir(directory);
  } catch (error) {
    if (isMissingDirectory(error)) {
      return [];
    }
    throw error;
  }
  return names.filter((name) => name.endsWith('.json')).map((name) => path.join(directory, name));
}

function requiredString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} is missing ${key}.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMissingDirectory(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

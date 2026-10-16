import fs from 'node:fs';
import { Mandate, MandateSchema } from '../types/models.js';

export function loadMandateFromFile(filePath: string): Mandate {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  return MandateSchema.parse(parsed);
}

export function parseMandate(data: unknown): Mandate {
  return MandateSchema.parse(data);
}

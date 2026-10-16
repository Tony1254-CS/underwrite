import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DocumentSchema,
  VendorSchema,
  PurchaseOrderSchema,
  Bytes32Schema,
} from '../src/types/models.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');

describe('Fixtures validation against Zod schemas (P3-T12)', () => {
  it('validates basic fixtures', () => {
    const basicInboxPath = path.join(rootDir, 'engine/fixtures/basic/inbox/documents.json');
    const basicWorldPath = path.join(rootDir, 'engine/fixtures/basic/world-state.json');

    const inbox = JSON.parse(fs.readFileSync(basicInboxPath, 'utf8'));
    expect(inbox).toHaveLength(5);
    for (const doc of inbox) {
      expect(() => DocumentSchema.parse(doc)).not.toThrow();
    }

    const world = JSON.parse(fs.readFileSync(basicWorldPath, 'utf8'));
    for (const v of world.vendors) {
      expect(() => VendorSchema.parse(v)).not.toThrow();
    }
    for (const po of world.purchaseOrders) {
      expect(() => PurchaseOrderSchema.parse(po)).not.toThrow();
    }
    for (const k of world.paidInvoiceKeys) {
      expect(() => Bytes32Schema.parse(k)).not.toThrow();
    }
  });

  it('validates attack fixtures', () => {
    const attackInboxPath = path.join(rootDir, 'engine/fixtures/attack/inbox/documents.json');
    const attackWorldPath = path.join(rootDir, 'engine/fixtures/attack/world-state.json');

    const inbox = JSON.parse(fs.readFileSync(attackInboxPath, 'utf8'));
    expect(inbox).toHaveLength(3);
    for (const doc of inbox) {
      expect(() => DocumentSchema.parse(doc)).not.toThrow();
    }

    const world = JSON.parse(fs.readFileSync(attackWorldPath, 'utf8'));
    for (const v of world.vendors) {
      expect(() => VendorSchema.parse(v)).not.toThrow();
    }
    for (const po of world.purchaseOrders) {
      expect(() => PurchaseOrderSchema.parse(po)).not.toThrow();
    }
    for (const k of world.paidInvoiceKeys) {
      expect(() => Bytes32Schema.parse(k)).not.toThrow();
    }
  });
});

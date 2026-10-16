import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VendorRegistry } from '../src/mandate/vendorRegistry.js';
import { parseMandate } from '../src/mandate/loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(__dirname, '../fixtures/vendors.json');

describe('Mandate and Vendor Registry (P3-T04)', () => {
  it('loads six demo vendors fixture per PV-06', () => {
    const raw = fs.readFileSync(fixturePath, 'utf8');
    const vendors = JSON.parse(raw);
    expect(vendors).toHaveLength(6);

    const registry = new VendorRegistry(vendors);
    expect(registry.size()).toBe(6);

    const acme = registry.getVendor('vendor-acme');
    expect(acme).toBeDefined();
    expect(acme?.name).toBe('Acme Hardware & Tools');
    expect(acme?.perWindowCap).toBe(500_000_000n);
  });

  it('guarantees agent lookups never return payout addresses', () => {
    const raw = fs.readFileSync(fixturePath, 'utf8');
    const vendors = JSON.parse(raw);
    const registry = new VendorRegistry(vendors);

    const results = registry.queryForAgent('acme');
    expect(results).toHaveLength(1);
    const agentView = results[0];

    expect(agentView.vendorId).toBe('vendor-acme');
    expect(agentView.name).toBe('Acme Hardware & Tools');
    expect(agentView.active).toBe(true);
    expect(agentView.inCooldown).toBe(false);

    // Verify 'payoutAddress' is strictly not present in AgentVendorView
    expect('payoutAddress' in agentView).toBe(false);
  });

  it('resolves payout address internally for registered vendor', () => {
    const raw = fs.readFileSync(fixturePath, 'utf8');
    const vendors = JSON.parse(raw);
    const registry = new VendorRegistry(vendors);

    const addr = registry.resolvePayoutAddress('vendor-acme');
    expect(addr).toBe('0x1111111111111111111111111111111111111111');
  });

  it('throws when resolving unknown vendor', () => {
    const registry = new VendorRegistry();
    expect(() => registry.resolvePayoutAddress('vendor-nonexistent')).toThrow(
      /Vendor not found in registry/
    );

    const query = registry.queryForAgent('nonexistent');
    expect(query).toHaveLength(0);
  });

  it('parses valid mandate', () => {
    const mandateData = {
      chainId: 31337,
      vault: '0x38461fd5B7421cE286bDD337255e55a41A9D6C1A',
      token: '0x9126090d4650bD722FD8763d164D325A270A78F2',
      ownerCeilings: {
        perTx: '300',
        perWindow: '1000',
        t2PerTx: '2000',
      },
      windowSeconds: 86400,
      reserveFloor: '500',
      challengePeriod: 300,
      recipientCooldown: 300,
      riskBudgetPerWindow: '10',
      threatShare: 0.2,
    };
    const mandate = parseMandate(mandateData);
    expect(mandate.chainId).toBe(31337);
    expect(mandate.ownerCeilings.perWindow).toBe(1000_000_000n);
  });
});

import { Vendor, VendorSchema, Address } from '../types/models.js';

export interface AgentVendorView {
  vendorId: string;
  name: string;
  active: boolean;
  inCooldown: boolean;
}

export class VendorRegistry {
  private vendors: Map<string, Vendor> = new Map();

  constructor(initialVendors?: Vendor[]) {
    if (initialVendors) {
      for (const v of initialVendors) {
        this.registerVendor(v);
      }
    }
  }

  public registerVendor(vendorData: unknown): Vendor {
    const validated = VendorSchema.parse(vendorData);
    this.vendors.set(validated.vendorId, validated);
    return validated;
  }

  public getVendor(vendorId: string): Vendor | undefined {
    return this.vendors.get(vendorId);
  }

  /**
   * Internal / policy function: resolves vendorId to payout address.
   * This is the ONLY place vendorId -> address happens.
   */
  public resolvePayoutAddress(vendorId: string): Address {
    const v = this.vendors.get(vendorId);
    if (!v) {
      throw new Error(`Vendor not found in registry: "${vendorId}"`);
    }
    return v.payoutAddress;
  }

  /**
   * Agent tool query function: returns vendor metadata WITHOUT any payout address.
   * Safe to return to LLM agent tools.
   */
  public queryForAgent(query: string, currentTimestamp = Math.floor(Date.now() / 1000)): AgentVendorView[] {
    const q = query.toLowerCase().trim();
    const results: AgentVendorView[] = [];

    for (const v of this.vendors.values()) {
      if (!q || v.vendorId.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)) {
        const inCooldown = !v.active || currentTimestamp < v.activatesAt;
        results.push({
          vendorId: v.vendorId,
          name: v.name,
          active: v.active,
          inCooldown,
        });
      }
    }

    return results;
  }

  public size(): number {
    return this.vendors.size;
  }
}

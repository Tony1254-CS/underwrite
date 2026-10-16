import { type Hex } from 'viem';
import { PurchaseOrder } from '../types/models.js';

export interface RecentPaymentRecord {
  vendorId: string;
  amount: bigint;
  poNumber?: string;
  invoiceKey: Hex;
  timestamp: number;
}

export interface PolicySnapshot {
  currentTimestamp: number;
  paused: boolean;
  configDrift?: boolean;
  vaultBalance: bigint;
  reserveFloor: bigint;
  bondRemaining: bigint;
  exposure: bigint;
  qualification?: {
    active: boolean;
    revoked: boolean;
    expired: boolean;
    t1MaxPerTx: bigint;
    t1MaxPerWindow: bigint;
    t2MaxPerTx: bigint;
    t2Allowed: boolean;
  };
  qualWindowSpent: bigint;
  recipientWindowSpent: bigint;
  paidInvoiceKeys: Set<Hex>;
  reservedInvoiceKeys: Set<Hex>;
  purchaseOrders: Map<string, PurchaseOrder>;
  recentPayments: RecentPaymentRecord[];
  registry?: import('../mandate/vendorRegistry.js').VendorRegistry;
}

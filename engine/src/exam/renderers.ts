/**
 * Document renderers for the Scenario Generator (P5-T03).
 * Renders plain email, PDF-extracted text (columnar), and table-like text (GRNs).
 */

export interface InvoiceDetails {
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  poNumber: string;
  amountUsdc: number;
  date: string;
  bankDetails?: {
    account: string;
    routing: string;
    bankName: string;
  };
}

export function renderEmail(
  from: string,
  to: string,
  subject: string,
  body: string
): string {
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${new Date().toISOString()}`,
    '',
    body,
  ].join('\n');
}

export function renderPdfText(details: InvoiceDetails): string {
  const lines: string[] = [];
  lines.push('================================================================');
  lines.push(`                        INVOICE                                `);
  lines.push('================================================================');
  lines.push(`Vendor:   ${details.vendorName} (${details.vendorId})`);
  lines.push(`Invoice:  ${details.invoiceNumber}`);
  lines.push(`PO Ref:   ${details.poNumber}`);
  lines.push(`Date:     ${details.date}`);
  lines.push('----------------------------------------------------------------');
  lines.push('Description                                         Amount      ');
  lines.push('----------------------------------------------------------------');
  const desc = 'Professional Services / Cloud Hardware Delivery'.padEnd(52, ' ');
  const amtStr = `$${details.amountUsdc.toFixed(2)}`.padStart(12, ' ');
  lines.push(`${desc}${amtStr}`);
  lines.push('----------------------------------------------------------------');
  lines.push(`Total Due:                                          ${amtStr}`);
  lines.push('================================================================');

  if (details.bankDetails) {
    lines.push('Payment Details (Wire / ACH):');
    lines.push(`Bank: ${details.bankDetails.bankName}`);
    lines.push(`Account: ${details.bankDetails.account}`);
    lines.push(`Routing: ${details.bankDetails.routing}`);
    lines.push('================================================================');
  }

  return lines.join('\n');
}

export function renderGrnText(
  poNumber: string,
  vendorId: string,
  grnId: string,
  date: string,
  items: Array<{ description: string; quantityReceived: number }>
): string {
  const lines: string[] = [];
  lines.push('----------------------------------------------------------------');
  lines.push('                 GOODS RECEIVED NOTE (GRN)                      ');
  lines.push('----------------------------------------------------------------');
  lines.push(`GRN ID:   ${grnId}`);
  lines.push(`PO Ref:   ${poNumber}`);
  lines.push(`Vendor:   ${vendorId}`);
  lines.push(`Date:     ${date}`);
  lines.push('----------------------------------------------------------------');
  lines.push('Item Description                                   Qty Received ');
  lines.push('----------------------------------------------------------------');
  for (const item of items) {
    const desc = item.description.padEnd(51, ' ');
    const qty = String(item.quantityReceived).padStart(12, ' ');
    lines.push(`${desc}${qty}`);
  }
  lines.push('----------------------------------------------------------------');
  lines.push('Status: INSPECTED AND ACCEPTED');
  return lines.join('\n');
}

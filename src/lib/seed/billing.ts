import type { Invoice, InvoiceLineItem } from '@/lib/types';

const DAY = 86_400_000;

/** Monthly rate card by permit category, in cents. */
export const PERMIT_RATES: Record<string, number> = {
  monthly: 185_00,
  annual: 155_00,
  executive: 320_00,
  overflow: 95_00,
  contractor: 140_00,
  valet: 210_00,
};

export function permitLineItem(permitType: string, period: string): InvoiceLineItem {
  const label = permitType.charAt(0).toUpperCase() + permitType.slice(1);
  return {
    description: `${label} permit — ${period}`,
    amountCents: PERMIT_RATES[permitType] ?? PERMIT_RATES.monthly!,
  };
}

export function invoiceTotal(invoice: Invoice): number {
  return invoice.lineItems.reduce((sum, item) => sum + item.amountCents, 0);
}

export function generateInvoices(): Invoice[] {
  const now = Date.now();
  const mk = (
    seq: number,
    holderId: string,
    holderName: string,
    holderCompany: string,
    permitType: string,
    period: string,
    status: Invoice['status'],
    issuedDaysAgo: number,
    extra?: InvoiceLineItem[],
  ): Invoice => {
    const lineItems = [permitLineItem(permitType, period), ...(extra ?? [])];
    const issuedAt = now - issuedDaysAgo * DAY;
    return {
      id: `INV-2026-${String(100 + seq)}`,
      holderId,
      holderName,
      holderCompany,
      period,
      lineItems,
      status,
      issuedAt,
      dueAt: issuedAt + 21 * DAY,
      paidAt: status === 'paid' ? issuedAt + Math.floor(2 + (seq % 5)) * DAY : undefined,
    };
  };

  return [
    mk(
      1,
      'PH-001',
      'Dana Whitfield',
      'Vertex Analytics · Fl 12',
      'executive',
      '2026-09',
      'sent',
      4,
    ),
    mk(2, 'PH-004', 'Omar Haddad', 'Vertex Analytics · Fl 12', 'annual', '2026-09', 'paid', 9),
    mk(3, 'PH-005', 'Priya Raman', 'Nimbus Health · Fl 14', 'annual', '2026-09', 'paid', 11),
    mk(4, 'PH-008', 'Hank Morrow', 'Elevate Mechanical', 'contractor', '2026-09', 'overdue', 27, [
      { description: 'Late fee — invoice INV-2026-092', amountCents: 15_00 },
    ]),
    mk(5, 'PH-011', 'Alan Prescott', 'Meridian Property Group', 'monthly', '2026-09', 'sent', 4),
    mk(6, 'PH-012', 'Bethany Cole', 'Halcyon Freight · Fl 2', 'monthly', '2026-08', 'overdue', 38, [
      { description: 'Late fee — invoice INV-2026-083', amountCents: 15_00 },
    ]),
    mk(7, 'PH-006', 'Ruth Okonkwo', 'Delta Robotics · Fl 7', 'annual', '2026-09', 'paid', 8, [
      { description: 'EV energy pass-through — Aug', amountCents: 42_60 },
    ]),
    mk(8, 'PH-015', 'Tobias Grant', 'Kestrel Media · Fl 3', 'monthly', '2026-08', 'paid', 39),
    mk(9, 'PH-009', 'Jun Sato', 'Skyline Glazing', 'contractor', '2026-09', 'draft', 0),
  ];
}

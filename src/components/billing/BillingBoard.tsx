'use client';

import * as React from 'react';

import type { Invoice, InvoiceStatus } from '@/lib/types';
import { invoiceTotal, permitLineItem } from '@/lib/seed';
import { useRealtime } from '@/lib/realtime';
import { downloadCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';
import { GenerateInvoiceDialog } from '@/components/billing/GenerateInvoiceDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconCheck } from '@/components/ui/Icons';

const STATUS_TONE: Record<InvoiceStatus, 'neutral' | 'info' | 'critical' | 'success'> = {
  draft: 'neutral',
  sent: 'info',
  overdue: 'critical',
  paid: 'success',
};

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Receipt download — renders the invoice as a client-side CSV receipt. */
function downloadReceipt(invoice: Invoice) {
  downloadCsv(
    `receipt-${invoice.id}.csv`,
    ['Field', 'Value'],
    [
      ['Receipt', invoice.id],
      ['Permit holder', invoice.holderName],
      ['Company', invoice.holderCompany],
      ['Period', invoice.period],
      ...invoice.lineItems.map((item) => [item.description, money(item.amountCents)]),
      ['Total', money(invoiceTotal(invoice))],
      ['Status', invoice.status],
      ['Paid at', invoice.paidAt ? new Date(invoice.paidAt).toISOString() : '—'],
    ],
  );
}

const PERIODS = ['2026-09', '2026-10', '2026-11'] as const;

/** Invoice generation dialog with company-email validation. */
const STATUS_FILTERS: Array<InvoiceStatus | 'all'> = ['all', 'draft', 'sent', 'overdue', 'paid'];

export function BillingBoard() {
  const { invoices, markInvoicePaid } = useRealtime();
  const [filter, setFilter] = React.useState<InvoiceStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const filtered = invoices.filter((invoice) => filter === 'all' || invoice.status === filter);
  const outstanding = invoices
    .filter((invoice) => invoice.status === 'sent' || invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const collected = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Outstanding',
            value: `$${(outstanding / 100).toFixed(0)}`,
            tone: 'text-status-reserved',
          },
          {
            label: 'Collected',
            value: `$${(collected / 100).toFixed(0)}`,
            tone: 'text-status-available',
          },
          {
            label: 'Overdue',
            value: String(invoices.filter((i) => i.status === 'overdue').length),
            tone: 'text-status-occupied',
          },
          {
            label: 'Drafts',
            value: String(invoices.filter((i) => i.status === 'draft').length),
            tone: 'text-slate-200',
          },
        ].map(({ label, value, tone }) => (
          <div
            key={label}
            className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
          >
            <h2 className="font-display text-xs uppercase tracking-widest text-slate-400">
              {label}
            </h2>
            <p className={cn('font-numeric mt-1 font-display text-2xl font-semibold', tone)}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Filter by payment status"
          className="flex flex-wrap gap-1"
        >
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={filter === status}
              onClick={() => setFilter(status)}
              className={cn(
                'rounded border px-2.5 py-1 font-display text-xs uppercase tracking-widest transition-colors',
                filter === status
                  ? 'border-signal-green bg-signal-green/15 text-signal-green'
                  : 'border-slate-700 text-slate-400 hover:text-slate-200',
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                `parklogic-invoices-${new Date().toISOString().slice(0, 10)}.csv`,
                ['Invoice', 'Holder', 'Company', 'Period', 'Total', 'Status', 'Due'],
                filtered.map((invoice) => [
                  invoice.id,
                  invoice.holderName,
                  invoice.holderCompany,
                  invoice.period,
                  money(invoiceTotal(invoice)),
                  invoice.status,
                  new Date(invoice.dueAt).toISOString().slice(0, 10),
                ]),
              )
            }
          >
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
            Generate Invoice
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-slate-700/70 bg-control-raised shadow-panel">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Permit-holder invoices with payment status</caption>
          <thead>
            <tr className="border-b border-slate-800 font-display text-xs uppercase tracking-widest text-slate-500">
              <th scope="col" className="px-4 py-2.5">
                Invoice
              </th>
              <th scope="col" className="px-4 py-2.5">
                Holder
              </th>
              <th scope="col" className="px-4 py-2.5">
                Period
              </th>
              <th scope="col" className="px-4 py-2.5">
                Total
              </th>
              <th scope="col" className="px-4 py-2.5">
                Due
              </th>
              <th scope="col" className="px-4 py-2.5">
                Status
              </th>
              <th scope="col" className="px-4 py-2.5">
                Receipt
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b border-slate-800/60 last:border-0 hover:bg-control-overlay/50"
              >
                <td className="font-numeric px-4 py-2.5 text-slate-200">{invoice.id}</td>
                <td className="px-4 py-2.5">
                  <span className="text-slate-100">{invoice.holderName}</span>
                  <span className="block text-xs text-slate-500">{invoice.holderCompany}</span>
                </td>
                <td className="font-numeric px-4 py-2.5 text-slate-300">{invoice.period}</td>
                <td className="font-numeric px-4 py-2.5 text-slate-200">
                  {money(invoiceTotal(invoice))}
                </td>
                <td className="font-numeric px-4 py-2.5 text-slate-400">
                  {new Date(invoice.dueAt).toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[invoice.status]} dot={invoice.status === 'overdue'}>
                    {invoice.status}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReceipt(invoice)}
                      disabled={invoice.status === 'draft'}
                      title={
                        invoice.status === 'draft'
                          ? 'Issue the invoice before a receipt can download'
                          : undefined
                      }
                    >
                      Receipt
                    </Button>
                    {invoice.status !== 'paid' && invoice.status !== 'draft' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => markInvoicePaid(invoice.id)}
                      >
                        <IconCheck /> Paid
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No invoices match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {dialogOpen && <GenerateInvoiceDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}

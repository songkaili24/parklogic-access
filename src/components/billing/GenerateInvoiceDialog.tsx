'use client';

import * as React from 'react';

import { validateCompanyEmail } from '@/lib/edge-cases';
import { permitLineItem } from '@/lib/seed';
import { useRealtime } from '@/lib/realtime';
import { Button } from '@/components/ui/Button';

const PERIODS = ['2026-09', '2026-10', '2026-11'] as const;

function money(cents: number): string {
  return `${(cents / 100).toFixed(2)}`;
}

export function GenerateInvoiceDialog({ onClose }: { onClose: () => void }) {
  const { holders, issueInvoice } = useRealtime();
  const [holderId, setHolderId] = React.useState(holders[0]?.id ?? '');
  const [period, setPeriod] = React.useState<(typeof PERIODS)[number]>(PERIODS[0]);
  const [email, setEmail] = React.useState('');
  const [evEnergy, setEvEnergy] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; holder?: string }>({});

  const holder = holders.find((h) => h.id === holderId);

  const lineItems = React.useMemo(() => {
    if (!holder) return [];
    const items = [permitLineItem(holder.permitType, period)];
    if (evEnergy)
      items.push({ description: `EV energy pass-through — ${period}`, amountCents: 38_40 });
    return items;
  }, [holder, period, evEnergy]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: { email?: string; holder?: string } = {};
    const emailCheck = validateCompanyEmail(email);
    if (!emailCheck.valid) nextErrors.email = emailCheck.error;
    if (!holder) nextErrors.holder = 'Select a permit holder';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !holder) return;

    issueInvoice({
      holderId: holder.id,
      holderName: holder.name,
      holderCompany: holder.company,
      period,
      lineItems,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Generate invoice"
    >
      <div className="absolute inset-0 bg-control-inset/80 backdrop-blur-sm" onClick={onClose} />
      <div className="scrollbar-thin relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded border border-slate-700 bg-control-raised p-4 shadow-panel">
        <h2 className="font-display text-sm uppercase tracking-widest text-white">
          Generate Invoice
        </h2>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3" noValidate>
          <div>
            <label
              htmlFor="invoice-holder"
              className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
            >
              Permit holder
            </label>
            <select
              id="invoice-holder"
              value={holderId}
              onChange={(e) => setHolderId(e.target.value)}
              className="h-10 w-full rounded border border-slate-700 bg-control-inset px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
            >
              {holders.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} — {h.permitType}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="invoice-period"
              className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
            >
              Billing period
            </label>
            <select
              id="invoice-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as (typeof PERIODS)[number])}
              className="font-numeric h-10 w-full rounded border border-slate-700 bg-control-inset px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="invoice-email"
              className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
            >
              Billing contact (company email)
            </label>
            <input
              id="invoice-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="billing@vertexanalytics.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'invoice-email-err' : undefined}
              className="h-10 w-full rounded border border-slate-700 bg-control-inset px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green"
            />
            {errors.email && (
              <p id="invoice-email-err" role="alert" className="mt-1 text-xs text-status-occupied">
                {errors.email}
              </p>
            )}
          </div>

          <label
            htmlFor="invoice-ev"
            className="flex cursor-pointer items-center gap-2 text-xs text-slate-400"
          >
            <input
              id="invoice-ev"
              type="checkbox"
              checked={evEnergy}
              onChange={(e) => setEvEnergy(e.target.checked)}
              className="accent-status-charging"
            />
            Include EV energy pass-through
          </label>

          <div
            className="rounded border border-slate-800 bg-control px-3 py-2 text-xs"
            aria-live="polite"
          >
            {lineItems.map((item) => (
              <p key={item.description} className="flex justify-between py-0.5 text-slate-300">
                <span>{item.description}</span>
                <span className="font-numeric">{money(item.amountCents)}</span>
              </p>
            ))}
            <p className="mt-1 flex justify-between border-t border-slate-800 pt-1 font-semibold text-slate-100">
              <span>Total</span>
              <span className="font-numeric">
                {money(lineItems.reduce((sum, item) => sum + item.amountCents, 0))}
              </span>
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Generate Draft
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


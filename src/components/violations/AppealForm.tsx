'use client';

import * as React from 'react';

import type { Violation } from '@/lib/types';
import { APPEAL_MIN_CHARS, validateAppealStatement, validateUpload } from '@/lib/edge-cases';
import { useRealtime } from '@/lib/realtime';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { IconAlertTriangle } from '@/components/ui/Icons';

/** ANPR evidence placeholder — renders the snapshot reference as a still. */
export function EvidencePlaceholder({ violation }: { violation: Violation }) {
  return (
    <div
      role="img"
      aria-label={`ANPR evidence still ${violation.evidenceRef} for citation ${violation.code}`}
      className="relative flex h-28 w-full flex-col items-center justify-center overflow-hidden rounded border border-slate-700 bg-control-inset"
    >
      <div className="bg-blueprint absolute inset-0 opacity-60" aria-hidden="true" />
      <IconAlertTriangle className="relative text-xl text-status-reserved" />
      <p className="relative mt-1 font-display text-xs uppercase tracking-widest text-slate-400">
        {violation.evidenceRef}
      </p>
      <p className="relative text-[10px] text-slate-600">
        ANPR still · {violation.plate} · full capture pending archival
      </p>
    </div>
  );
}

/** Appeal form: 50+ character statement plus validated evidence photo. */
export function AppealForm({ violation, onDone }: { violation: Violation; onDone: () => void }) {
  const { submitAppeal } = useRealtime();
  const [statement, setStatement] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<{ statement?: string; file?: string }>({});
  const [fileName, setFileName] = React.useState<string | null>(null);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setFileName(selected ? selected.name : null);
    setErrors((prev) => ({ ...prev, file: undefined }));
    if (selected) {
      const check = validateUpload(selected, 'evidence_photo');
      if (!check.valid) setErrors((prev) => ({ ...prev, file: check.error }));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const statementCheck = validateAppealStatement(statement);
    const nextErrors: { statement?: string; file?: string } = {};
    if (!statementCheck.valid) nextErrors.statement = statementCheck.error;
    if (file) {
      const fileCheck = validateUpload(file, 'evidence_photo');
      if (!fileCheck.valid) nextErrors.file = fileCheck.error;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    submitAppeal(violation.id, statement.trim(), fileName ?? undefined);
    onDone();
  };

  const chars = statement.trim().length;
  const charTone = chars >= APPEAL_MIN_CHARS ? 'text-status-available' : 'text-status-reserved';

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div>
        <label
          htmlFor={`appeal-${violation.id}`}
          className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
        >
          Appeal statement
        </label>
        <textarea
          id={`appeal-${violation.id}`}
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={4}
          placeholder="Explain the circumstances — cite permit numbers, pass codes, or gate timestamps where relevant…"
          aria-invalid={!!errors.statement}
          aria-describedby={errors.statement ? `appeal-err-${violation.id}` : undefined}
          className="w-full rounded border border-slate-700 bg-control-inset p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green"
        />
        <p className={cn('font-numeric mt-1 text-xs', charTone)}>
          {chars} / {APPEAL_MIN_CHARS} characters minimum
        </p>
        {errors.statement && (
          <p
            id={`appeal-err-${violation.id}`}
            role="alert"
            className="mt-1 text-xs text-status-occupied"
          >
            {errors.statement}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor={`evidence-${violation.id}`}
          className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
        >
          Supporting photo (optional)
        </label>
        <input
          id={`evidence-${violation.id}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={handleFile}
          aria-invalid={!!errors.file}
          className="w-full text-xs text-slate-400 file:mr-3 file:rounded file:border-0 file:bg-control-overlay file:px-3 file:py-1.5 file:font-display file:text-xs file:uppercase file:tracking-widest file:text-slate-200 hover:file:bg-slate-600/40"
        />
        {fileName && !errors.file && (
          <p className="mt-1 text-xs text-status-available">Attached: {fileName}</p>
        )}
        {errors.file && (
          <p role="alert" className="mt-1 text-xs text-status-occupied">
            {errors.file}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm">
          Submit Appeal
        </Button>
      </div>
    </form>
  );
}


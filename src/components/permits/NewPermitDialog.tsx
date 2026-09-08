'use client';

import * as React from 'react';

import type { PermitType, VehicleClass } from '@/lib/types';
import { PERMIT_TYPE_LABELS, VEHICLE_CLASS_LABELS } from '@/lib/constants';
import { validateCompanyEmail, validateUpload } from '@/lib/edge-cases';
import { useRealtime } from '@/lib/realtime';
import { validatePlate } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { LicensePlateInput } from '@/components/ui/LicensePlateInput';

const inputClass =
  'h-10 w-full rounded border border-slate-700 bg-control-inset px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green';

/** "New Permit" application dialog. */
export function NewPermitDialog({ onClose }: { onClose: () => void }) {
  const { assignPermit, waitlist, addToWaitlist } = useRealtime();
  const [name, setName] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [permitType, setPermitType] = React.useState<PermitType>('monthly');
  const [vehicle, setVehicle] = React.useState('');
  const [vehicleClass, setVehicleClass] = React.useState<VehicleClass>('sedan');
  const [plate, setPlate] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [registration, setRegistration] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const waitlistForType = waitlist.filter((entry) => entry.permitType === permitType);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="New permit application"
    >
      <div className="absolute inset-0 bg-control-inset/80 backdrop-blur-sm" onClick={onClose} />
      <div className="scrollbar-thin relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded border border-slate-700 bg-control-raised p-4 shadow-panel">
        <h2 className="font-display text-sm uppercase tracking-widest text-white">
          New Permit Application
        </h2>

        <form
          className="mt-3 space-y-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const plateCheck = validatePlate(plate);
            const emailCheck = validateCompanyEmail(email);
            if (!name.trim()) return setError('Applicant name is required.');
            if (!emailCheck.valid) return setError(emailCheck.error ?? 'Company email invalid.');
            if (!registration || registration.size === 0) {
              return setError(
                'Vehicle registration document is required before a permit can issue.',
              );
            }
            const registrationCheck = validateUpload(registration, 'vehicle_registration');
            if (!registrationCheck.valid)
              return setError(
                registrationCheck.error ?? 'Registration document failed validation.',
              );
            if (!vehicle.trim())
              return setError('Vehicle make/model is required for ANPR records.');
            if (!plateCheck.valid) return setError(plateCheck.error ?? 'Plate failed validation.');
            assignPermit({
              name: name.trim(),
              company: company.trim() || '—',
              permitType,
              plate: plateCheck.normalized,
              vehicle: vehicle.trim(),
              vehicleClass,
            });
            onClose();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="permit-name"
                className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
              >
                Applicant
              </label>
              <input
                id="permit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Jamie Fox"
              />
            </div>
            <div>
              <label
                htmlFor="permit-company"
                className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
              >
                Company
              </label>
              <input
                id="permit-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
                placeholder="Vertex Analytics"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="permit-type"
                className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
              >
                Permit category
              </label>
              <select
                id="permit-type"
                value={permitType}
                onChange={(e) => setPermitType(e.target.value as PermitType)}
                className={inputClass}
              >
                {(Object.keys(PERMIT_TYPE_LABELS) as PermitType[]).map((type) => (
                  <option key={type} value={type}>
                    {PERMIT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="permit-class"
                className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
              >
                Vehicle class
              </label>
              <select
                id="permit-class"
                value={vehicleClass}
                onChange={(e) => setVehicleClass(e.target.value as VehicleClass)}
                className={inputClass}
              >
                {(Object.keys(VEHICLE_CLASS_LABELS) as VehicleClass[]).map((vc) => (
                  <option key={vc} value={vc}>
                    {VEHICLE_CLASS_LABELS[vc]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="permit-vehicle"
              className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
            >
              Vehicle make / model
            </label>
            <input
              id="permit-vehicle"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className={inputClass}
              placeholder="Toyota Camry Hybrid"
            />
          </div>

          <div>
            <label
              htmlFor="permit-email"
              className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
            >
              Company email
            </label>
            <input
              id="permit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="billing@vertexanalytics.com"
              className={inputClass}
            />
          </div>

          <div>
            <span className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              License plate
            </span>
            <LicensePlateInput value={plate} onChange={setPlate} />
          </div>

          <div>
            <label
              htmlFor="permit-registration"
              className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
            >
              Vehicle registration (required)
            </label>
            <input
              id="permit-registration"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(e) => setRegistration(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-slate-400 file:mr-3 file:rounded file:border-0 file:bg-control-overlay file:px-3 file:py-1.5 file:font-display file:text-xs file:uppercase file:tracking-widest file:text-slate-200 hover:file:bg-slate-600/40"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded border border-status-occupied/50 bg-status-occupied/10 px-3 py-2 text-sm text-status-occupied"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                addToWaitlist({
                  name: name.trim() || 'Unnamed applicant',
                  company: company.trim() || '—',
                  permitType,
                  plate: plate.trim() || 'TBD',
                  vehicle: vehicle.trim() || '—',
                  requestedAt: Date.now(),
                });
                onClose();
              }}
            >
              Add to Waitlist Instead
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Issue Permit
            </Button>
          </div>
        </form>

        {waitlistForType.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Note: {waitlistForType.length} applicant{waitlistForType.length === 1 ? '' : 's'}{' '}
            already waitlisted for {PERMIT_TYPE_LABELS[permitType]}.
          </p>
        )}
      </div>
    </div>
  );
}

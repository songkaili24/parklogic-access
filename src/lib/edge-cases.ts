/**
 * Edge-case validation for permit applications, violation appeals, and
 * duplicate-plate pre-registration. Pure functions — no app state.
 */

export interface FieldCheck {
  valid: boolean;
  error?: string;
}

/** Company email: must be a plausible address on a non-free mail domain. */
const FREE_MAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateCompanyEmail(raw: string): FieldCheck {
  const value = raw.trim().toLowerCase();
  if (value.length === 0)
    return { valid: false, error: 'Company email required for permit correspondence' };
  if (!EMAIL_RE.test(value)) return { valid: false, error: 'Enter a valid email address' };
  const domain = value.split('@')[1] ?? '';
  if (FREE_MAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: 'Use a company domain — personal mail providers are not accepted',
    };
  }
  return { valid: true };
}

/** Appeal statements: minimum substance (50 characters) so reviewers get context. */
export const APPEAL_MIN_CHARS = 50;

export function validateAppealStatement(raw: string): FieldCheck {
  const value = raw.trim();
  if (value.length === 0) return { valid: false, error: 'Appeal statement required' };
  if (value.length < APPEAL_MIN_CHARS) {
    return {
      valid: false,
      error: `Add detail — minimum ${APPEAL_MIN_CHARS} characters (currently ${value.length})`,
    };
  }
  return { valid: true };
}

export type UploadCheckKind = 'evidence_photo' | 'vehicle_registration';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function validateUpload(file: File, kind: UploadCheckKind): FieldCheck {
  const accepted = kind === 'evidence_photo' ? IMAGE_TYPES : DOC_TYPES;
  const label = kind === 'evidence_photo' ? 'Evidence photo' : 'Vehicle registration';
  if (file.size === 0) return { valid: false, error: `${label}: file is empty` };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { valid: false, error: `${label}: exceeds 8 MB` };
  }
  if (!accepted.includes(file.type)) {
    const expected = kind === 'evidence_photo' ? 'JPEG, PNG, WebP, or HEIC' : 'PDF, JPEG, or PNG';
    return { valid: false, error: `${label}: unsupported format — expected ${expected}` };
  }
  return { valid: true };
}

/** ISO date (YYYY-MM-DD) for the day a plate first registers. */
export function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface DuplicatePlateCheckArgs {
  plate: string;
  validFrom: number;
  passes: Array<{ plate: string; validFrom: number; status: string; code: string }>;
}

/**
 * Pre-registration guard: the same plate cannot hold two passes that start
 * the same calendar day (overlapping windows at the gate).
 */
export function findDuplicatePlate({
  plate,
  validFrom,
  passes,
}: DuplicatePlateCheckArgs): FieldCheck {
  const normalized = plate.replace(/[-\s]/g, '').toUpperCase();
  const day = dayKey(validFrom);
  const clash = passes.find(
    (pass) =>
      pass.plate.replace(/[-\s]/g, '').toUpperCase() === normalized &&
      dayKey(pass.validFrom) === day &&
      pass.status !== 'expired' &&
      pass.status !== 'revoked',
  );
  if (clash) {
    return {
      valid: false,
      error: `Plate already registered for ${day} (pass ${clash.code}) — cancel it or use a different vehicle`,
    };
  }
  return { valid: true };
}

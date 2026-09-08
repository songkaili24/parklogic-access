/**
 * License plate handling for gate-side validation.
 * Plates are normalized to uppercase alphanumeric; display formatting
 * inserts a dash on typical 7-character US plates (ABC-1234).
 */

export interface PlateValidation {
  valid: boolean;
  error?: string;
  normalized: string;
}

const COMPACT_REGEX = /^[A-Z0-9]{2,8}$/;

/** Strip anything that is not A-Z, 0-9, dash or space; uppercase; cap length. */
export function normalizePlateInput(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9- ]/g, '')
    .slice(0, 10);
}

export function validatePlate(raw: string): PlateValidation {
  const compact = raw.replace(/[-\s]/g, '');

  if (compact.length === 0) {
    return { valid: false, error: 'Plate required for gate validation', normalized: '' };
  }
  if (compact.length < 2) {
    return { valid: false, error: 'Too short — minimum 2 characters', normalized: compact };
  }
  if (compact.length > 8) {
    return { valid: false, error: 'Too long — maximum 8 characters', normalized: compact };
  }
  if (!COMPACT_REGEX.test(compact)) {
    return { valid: false, error: 'Letters and numbers only', normalized: compact };
  }

  const normalized = compact.length === 7 ? `${compact.slice(0, 3)}-${compact.slice(3)}` : compact;
  return { valid: true, normalized };
}

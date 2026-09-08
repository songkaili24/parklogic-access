import { describe, expect, it } from 'vitest';

import {
  APPEAL_MIN_CHARS,
  dayKey,
  findDuplicatePlate,
  validateAppealStatement,
  validateCompanyEmail,
  validateUpload,
} from '@/lib/edge-cases';

describe('validateCompanyEmail', () => {
  it.each([
    ['', 'required'],
    ['not-an-email', 'valid email'],
    ['missing@tld', 'valid email'],
    ['ops@gmail.com', 'company domain'],
    ['ops@yahoo.com', 'company domain'],
    ['ops@outlook.com', 'company domain'],
  ])('rejects %j', (input, fragment) => {
    const result = validateCompanyEmail(input);
    expect(result.valid).toBe(false);
    expect(result.error).toContain(fragment);
  });

  it('accepts a plausible company address', () => {
    expect(validateCompanyEmail('billing@vertexanalytics.com')).toEqual({ valid: true });
  });

  it('is case-insensitive on the domain check', () => {
    expect(validateCompanyEmail('Ops@GMAIL.COM').valid).toBe(false);
  });
});

describe('validateAppealStatement', () => {
  it('rejects an empty statement', () => {
    expect(validateAppealStatement('   ')).toEqual({ valid: false, error: 'Appeal statement required' });
  });

  it('rejects statements under the 50-character minimum after trimming', () => {
    const result = validateAppealStatement('x'.repeat(49));
    expect(result.valid).toBe(false);
    expect(result.error).toContain(`${APPEAL_MIN_CHARS} characters`);
  });

  it('counts trimmed length, so padding cannot satisfy the minimum alone', () => {
    // 45 real chars + 10 spaces = 55 raw, 45 trimmed → still rejected.
    expect(validateAppealStatement(`${'x'.repeat(45)}${' '.repeat(10)}`).valid).toBe(false);
  });

  it('accepts a statement at exactly the minimum trimmed length', () => {
    expect(validateAppealStatement(`${'x'.repeat(50)} `).valid).toBe(true);
    expect(validateAppealStatement('x'.repeat(50)).valid).toBe(true);
  });
});

describe('validateUpload', () => {
  const file = (name: string, type: string, size: number) =>
    new File(['x'.repeat(size)], name, { type });

  it('rejects an empty file', () => {
    const result = validateUpload(file('a.jpg', 'image/jpeg', 0), 'evidence_photo');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('rejects files over 8 MB', () => {
    const result = validateUpload(file('big.jpg', 'image/jpeg', 8 * 1024 * 1024 + 1), 'evidence_photo');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('8 MB');
  });

  it('rejects unsupported formats for evidence photos', () => {
    const result = validateUpload(file('a.pdf', 'application/pdf', 100), 'evidence_photo');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('unsupported format');
  });

  it('accepts a valid evidence photo', () => {
    expect(validateUpload(file('a.heic', 'image/heic', 100), 'evidence_photo')).toEqual({ valid: true });
  });

  it('accepts PDF or image registrations and rejects others', () => {
    expect(validateUpload(file('r.pdf', 'application/pdf', 100), 'vehicle_registration')).toEqual({ valid: true });
    expect(validateUpload(file('r.png', 'image/png', 100), 'vehicle_registration')).toEqual({ valid: true });
    expect(validateUpload(file('r.webp', 'image/webp', 100), 'vehicle_registration').valid).toBe(false);
  });
});

describe('findDuplicatePlate', () => {
  const passes = [
    { plate: 'ABC-1234', validFrom: Date.UTC(2026, 8, 8, 9), status: 'active', code: 'PL-AAAA' },
    { plate: 'XYZ 0001', validFrom: Date.UTC(2026, 8, 9, 9), status: 'scheduled', code: 'PL-BBBB' },
    { plate: 'OLD-0001', validFrom: Date.UTC(2026, 8, 1, 9), status: 'expired', code: 'PL-CCCC' },
  ];

  it('flags a same-day duplicate regardless of separators or case', () => {
    const result = findDuplicatePlate({ plate: 'abc 1234', validFrom: Date.UTC(2026, 8, 8, 15), passes });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PL-AAAA');
  });

  it('allows the same plate on a different day', () => {
    expect(findDuplicatePlate({ plate: 'ABC-1234', validFrom: Date.UTC(2026, 8, 10), passes }).valid).toBe(true);
  });

  it('ignores expired passes when checking the same day', () => {
    expect(findDuplicatePlate({ plate: 'OLD-0001', validFrom: Date.UTC(2026, 8, 1), passes }).valid).toBe(true);
  });

  it('treats an empty plate as free (gate validation handles emptiness)', () => {
    expect(findDuplicatePlate({ plate: '', validFrom: Date.UTC(2026, 8, 8), passes }).valid).toBe(true);
  });

  it('dayKey buckets by UTC calendar day', () => {
    expect(dayKey(Date.UTC(2026, 8, 8, 23, 59))).toBe('2026-09-08');
  });
});

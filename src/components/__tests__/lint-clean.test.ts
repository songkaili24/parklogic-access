import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const ESLINT_BIN = path.join(
  path.dirname(require.resolve('eslint/package.json')),
  'bin',
  'eslint.js',
);
const ROOT = path.resolve(__dirname, '../../..');

/** Guards the Vercel build: these files must stay free of lint errors. */
const GUARDED_FILES = [
  'src/components/billing/BillingBoard.tsx',
  'src/components/billing/GenerateInvoiceDialog.tsx',
];

function lint(files: string[]): string {
  return execFileSync(process.execPath, [ESLINT_BIN, ...files, '--format', 'unix'], {
    cwd: ROOT,
    encoding: 'utf-8',
  });
}

describe('lint regression guard', () => {
  it('guarded billing components lint clean', () => {
    expect(() => lint(GUARDED_FILES)).not.toThrow();
  });
});

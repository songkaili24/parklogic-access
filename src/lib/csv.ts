/** Minimal CSV serialization + browser download for report exports. */

export function toCsv(headers: string[], rows: Array<Array<string | number | undefined>>): string {
  const escape = (value: string | number | undefined): string => {
    const str = value === undefined || value === null ? '' : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
}

/** Client-side CSV download. No-op on the server. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | undefined>>,
): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

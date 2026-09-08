import '@testing-library/jest-dom/vitest';

// jsdom does not implement blob URL creation; downloadCsv relies on it.
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock';
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {};
}

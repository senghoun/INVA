/** Validate JSON columns that represent lists before using them in access decisions. */
export function jsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
    throw new Error('Expected a JSON array of strings');
  }
  return value;
}

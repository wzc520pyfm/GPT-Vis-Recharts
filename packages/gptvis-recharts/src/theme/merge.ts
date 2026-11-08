export function mergeObjects<T extends Record<string, unknown>>(base: T, override?: Record<string, unknown>): T {
  if (!override) return base;
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    const merged =
      current !== null &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
        ? mergeObjects(current as Record<string, unknown>, value as Record<string, unknown>)
        : value;
    Object.defineProperty(result, key, {
      value: merged,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  return result as T;
}

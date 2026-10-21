export function omitUnchangedMediaFields<T extends object>(
  payload: T,
  fields: readonly (keyof T)[],
): Partial<T> {
  const result = { ...payload } as Record<string, unknown>;
  for (const field of fields) {
    delete result[String(field)];
  }
  return result as Partial<T>;
}

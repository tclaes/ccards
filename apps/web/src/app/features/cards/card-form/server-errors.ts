import type { FieldViolation } from '@ccards/api-client';

/** Splits the API's violations into those for a field on the form and the rest. */
export function splitViolations(
  violations: readonly FieldViolation[],
  formFields: readonly string[],
): { forFields: FieldViolation[]; other: FieldViolation[] } {
  const forFields = violations.filter((v) => formFields.includes(v.field));
  const other = violations.filter((v) => !formFields.includes(v.field));
  return { forFields, other };
}

import { BarcodeType } from '@ccards/api-client';

const GS1_LENGTHS: Partial<Record<BarcodeType, number>> = {
  [BarcodeType.Ean13]: 13,
  [BarcodeType.Ean8]: 8,
  [BarcodeType.UpcA]: 12,
};

/**
 * Same rule as the API (`CardNumberValidator`): EAN-13, EAN-8 and UPC-A are
 * digits with a GS1 check digit, other types take any text. Returns the error
 * message, or `undefined` when the number is fine. A blank number is left to
 * the required check.
 */
export function cardNumberError(
  type: BarcodeType,
  number: string,
): string | undefined {
  const length = GS1_LENGTHS[type];
  if (length === undefined || number.trim() === '') return undefined;
  if (isGs1Number(number, length)) return undefined;
  return `Must be ${length} digits with a valid check digit`;
}

function isGs1Number(number: string, length: number): boolean {
  if (number.length !== length || !/^\d+$/.test(number)) return false;
  // Weights 3,1,3,1... from the digit left of the check digit, moving left.
  let sum = 0;
  let weight = 3;
  for (let i = length - 2; i >= 0; i--) {
    sum += Number(number[i]) * weight;
    weight = 4 - weight;
  }
  return (10 - (sum % 10)) % 10 === Number(number[length - 1]);
}

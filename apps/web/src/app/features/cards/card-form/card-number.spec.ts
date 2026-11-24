import { BarcodeType } from '@ccards/api-client';
import { cardNumberError } from './card-number';

describe('cardNumberError', () => {
  it.each([
    [BarcodeType.Ean13, '4006381333931'],
    [BarcodeType.Ean8, '96385074'],
    [BarcodeType.UpcA, '036000291452'],
    [BarcodeType.Code128, 'AB-1234'],
    [BarcodeType.QrCode, 'https://example.com'],
  ])('accepts a valid %s number', (type, number) => {
    expect(cardNumberError(type, number)).toBeUndefined();
  });

  it.each([
    ['wrong check digit', BarcodeType.Ean13, '4006381333932'],
    ['wrong length', BarcodeType.Ean8, '963850741'],
    ['letters', BarcodeType.UpcA, '03600029145A'],
  ])('rejects %s', (_, type, number) => {
    expect(cardNumberError(type, number)).toContain('digits');
  });

  it('leaves a blank number to the required check', () => {
    expect(cardNumberError(BarcodeType.Ean13, '')).toBeUndefined();
  });
});

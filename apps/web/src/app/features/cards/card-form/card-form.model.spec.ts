import { BarcodeType } from '@ccards/api-client';
import type { Card } from '@ccards/api-client';
import { toCardInput, toCardPatch, toFormValue } from './card-form.model';

const card = {
  id: 'c1',
  name: 'Clubkaart',
  store: 'Delhaize',
  cardNumber: 'AB-1',
  barcodeType: BarcodeType.Code128,
  note: 'hello',
  version: 3,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
} as Card;

describe('card form model', () => {
  it('turns missing optional fields into empty strings', () => {
    expect(toFormValue(card).color).toBe('');
  });

  it('omits empty optional fields when creating', () => {
    const input = toCardInput({ ...toFormValue(card), note: '' });
    expect(input.color).toBeUndefined();
    expect(input.note).toBeUndefined();
  });

  it('patches only the changed fields plus the version', () => {
    const patch = toCardPatch(card, { ...toFormValue(card), name: 'Bonus' });
    expect(patch).toEqual({ name: 'Bonus', version: 3 });
  });

  it('sets a cleared optional field to null', () => {
    const patch = toCardPatch(card, { ...toFormValue(card), note: '' });
    expect(patch).toEqual({ note: null, version: 3 });
  });
});

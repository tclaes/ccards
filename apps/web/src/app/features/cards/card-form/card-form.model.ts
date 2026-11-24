import { BarcodeType } from '@ccards/api-client';
import type { Card, CardInput, CardPatch } from '@ccards/api-client';

/** What the form edits. Optional fields are empty strings, never null. */
export interface CardFormValue {
  name: string;
  store: string;
  cardNumber: string;
  barcodeType: BarcodeType;
  color: string;
  note: string;
}

export const EMPTY_CARD_FORM: CardFormValue = {
  name: '',
  store: '',
  cardNumber: '',
  barcodeType: BarcodeType.Code128,
  color: '',
  note: '',
};

export const BARCODE_TYPE_OPTIONS: readonly {
  value: BarcodeType;
  label: string;
}[] = [
  { value: BarcodeType.Code128, label: 'Code 128' },
  { value: BarcodeType.Ean13, label: 'EAN-13' },
  { value: BarcodeType.Ean8, label: 'EAN-8' },
  { value: BarcodeType.UpcA, label: 'UPC-A' },
  { value: BarcodeType.QrCode, label: 'QR code' },
];

export function toFormValue(card: Card): CardFormValue {
  return { ...card, color: card.color ?? '', note: card.note ?? '' };
}

export function toCardInput(value: CardFormValue): CardInput {
  return {
    ...value,
    color: value.color || undefined,
    note: value.note || undefined,
  };
}

/** Only the fields that differ from the card, plus its version; `null` clears an optional field. */
export function toCardPatch(card: Card, value: CardFormValue): CardPatch {
  const before = toFormValue(card);
  const patch: CardPatch = { version: card.version };
  if (value.name !== before.name) patch.name = value.name;
  if (value.store !== before.store) patch.store = value.store;
  if (value.cardNumber !== before.cardNumber)
    patch.cardNumber = value.cardNumber;
  if (value.barcodeType !== before.barcodeType)
    patch.barcodeType = value.barcodeType;
  if (value.color !== before.color) patch.color = value.color || null;
  if (value.note !== before.note) patch.note = value.note || null;
  return patch;
}

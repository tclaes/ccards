import type { CardsService } from '@ccards/api-client';

/** The orders the API offers, taken from the generated `listCards` call. */
export type CardSort = NonNullable<Parameters<CardsService['listCards']>[2]>;

export const CARD_SORT_OPTIONS: readonly { value: CardSort; label: string }[] =
  [
    { value: 'name', label: 'Name' },
    { value: 'lastUsed', label: 'Last used' },
    { value: 'mostUsed', label: 'Most used' },
  ];

export const DEFAULT_CARD_SORT: CardSort = 'name';

export const CARD_SORT_STORAGE_KEY = 'ccards.cardSort';

import type { CardsService } from '@ccards/api-client';

/** The orders the API offers, taken from the generated `listCards` call. */
export type CardSort = NonNullable<Parameters<CardsService['listCards']>[2]>;

export const CARD_SORT_OPTIONS: readonly { value: CardSort; label: string }[] =
  [
    { value: 'name', label: 'Name' },
    { value: 'lastUsed', label: 'Last used' },
    { value: 'mostUsed', label: 'Most used' },
  ];

/** What screen readers hear once a newly chosen order is on screen. */
export const CARD_SORT_ANNOUNCEMENTS: Readonly<Record<CardSort, string>> = {
  name: 'Sorted by name',
  lastUsed: 'Sorted by last used',
  mostUsed: 'Sorted by most used',
};

export const DEFAULT_CARD_SORT: CardSort = 'name';

export const CARD_SORT_STORAGE_KEY = 'ccards.cardSort';

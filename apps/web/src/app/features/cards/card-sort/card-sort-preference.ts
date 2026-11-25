import { DOCUMENT } from '@angular/common';
import { inject, Service, signal } from '@angular/core';
import {
  CARD_SORT_OPTIONS,
  CARD_SORT_STORAGE_KEY,
  type CardSort,
  DEFAULT_CARD_SORT,
} from './card-sort.model';

/**
 * The sort order of the card list, remembered on this device. Where the browser refuses
 * storage the order still works, it is just forgotten after the visit.
 */
@Service()
export class CardSortPreference {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly chosen = signal(this.remembered());

  readonly sort = this.chosen.asReadonly();

  choose(sort: CardSort): void {
    this.chosen.set(sort);
    try {
      this.window?.localStorage.setItem(CARD_SORT_STORAGE_KEY, sort);
    } catch (error) {
      console.warn('Could not remember the sort order', error);
    }
  }

  private remembered(): CardSort {
    try {
      const stored = this.window?.localStorage.getItem(CARD_SORT_STORAGE_KEY);
      const known = CARD_SORT_OPTIONS.find((option) => option.value === stored);
      return known?.value ?? DEFAULT_CARD_SORT;
    } catch (error) {
      console.warn('Could not read the remembered sort order', error);
      return DEFAULT_CARD_SORT;
    }
  }
}

import { Component, input, output } from '@angular/core';
import { CARD_SORT_OPTIONS, type CardSort } from './card-sort.model';

/** The "Sort by" control of the card list. Dumb: the order comes in, a choice goes out. */
@Component({
  selector: 'app-card-sort-select',
  template: `
    <label for="card-sort">Sort by</label>
    <select #select id="card-sort" (change)="choose(select.value)">
      @for (option of options; track option.value) {
        <option [value]="option.value" [selected]="option.value === sort()">
          {{ option.label }}
        </option>
      }
    </select>
  `,
  styleUrl: './card-sort-select.css',
})
export class CardSortSelect {
  readonly sort = input.required<CardSort>();
  readonly sortChange = output<CardSort>();

  protected readonly options = CARD_SORT_OPTIONS;

  protected choose(value: string): void {
    const option = this.options.find((candidate) => candidate.value === value);
    if (option) this.sortChange.emit(option.value);
  }
}

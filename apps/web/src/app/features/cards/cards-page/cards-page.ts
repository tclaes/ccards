import { DOCUMENT } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import {
  afterRenderEffect,
  Component,
  computed,
  inject,
  linkedSignal,
  resource,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardsService } from '@ccards/api-client';
import type { Card, CardPage } from '@ccards/api-client';
import { firstValueFrom } from 'rxjs';
import { SKIP_ERROR_NOTIFICATION } from '../../../core/http/error.interceptor';
import { LoadingIndicator, StateMessage } from '@ui';
import { CardSortPreference } from '../card-sort/card-sort-preference';
import { CardSortSelect } from '../card-sort/card-sort-select';
import {
  CARD_SORT_ANNOUNCEMENTS,
  type CardSort,
} from '../card-sort/card-sort.model';
import { CardTile } from '../card-tile/card-tile';

const PAGE_SIZE = 100;

/** The card overview: fetches the cards in the chosen order and shows loading, error, empty or the grid. */
@Component({
  selector: 'app-cards-page',
  imports: [
    CardSortSelect,
    CardTile,
    LoadingIndicator,
    RouterLink,
    StateMessage,
  ],
  template: `
    <header class="brand">
      <img src="favicon.svg" alt="" width="32" height="32" />
      <span class="brand-name">ccards</span>
    </header>
    <div class="title-row">
      <h1>My cards</h1>
      <a class="add" role="button" routerLink="/cards/new">Add card</a>
    </div>
    @switch (view()) {
      @case ('loading') {
        <app-loading-indicator message="Loading cards…" />
      }
      @case ('error') {
        <app-state-message
          announce="alert"
          message="We could not load your cards."
          actionLabel="Try again"
          (action)="cards.reload()"
        />
      }
      @case ('empty') {
        <app-state-message message="You have no cards yet." />
      }
      @case ('grid') {
        <app-card-sort-select
          [sort]="preference.sort()"
          (sortChange)="chooseSort($event)"
        />
        <ul class="grid">
          @for (card of items(); track card.id) {
            <li>
              <a
                [routerLink]="['/cards', card.id]"
                [attr.aria-label]="'Open ' + card.name"
              >
                <app-card-tile
                  [name]="card.name"
                  [store]="card.store"
                  [color]="card.color"
                />
              </a>
              <button
                #star
                type="button"
                class="corner favorite"
                [attr.aria-label]="'Favorite ' + card.name"
                [attr.aria-pressed]="card.favorite"
                (click)="toggleFavorite(card, star)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1-5.4-3-5.4 3 1.1-6.1-4.5-4.3 6.1-.8Z"
                  />
                </svg>
              </button>
              <a
                class="corner edit"
                [routerLink]="['/cards', card.id, 'edit']"
                [attr.aria-label]="'Edit ' + card.name"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M4 20h4L19 9l-4-4L4 16v4Zm13.6-13.6 1.4-1.4a1.4 1.4 0 0 1 2 0l.6.6a1.4 1.4 0 0 1 0 2l-1.4 1.4-2.6-2.6Z"
                  />
                </svg>
              </a>
            </li>
          }
        </ul>
      }
    }
    <!-- Outside the switch: a live region must exist before its text changes. -->
    <p class="visually-hidden" role="status">{{ announcement() }}</p>
  `,
  styleUrl: './cards-page.css',
})
export class CardsPage {
  private readonly api = inject(CardsService);
  private readonly document = inject(DOCUMENT);
  protected readonly preference = inject(CardSortPreference);

  /** Raised after a change on the server, to fetch the list again. */
  private readonly revision = signal(0);

  protected readonly cards = resource({
    params: () => ({
      sort: this.preference.sort(),
      revision: this.revision(),
    }),
    loader: ({ params }) =>
      firstValueFrom(
        // The page shows its own error state, so no toast for the same failure.
        this.api.listCards(0, PAGE_SIZE, params.sort, 'body', false, {
          context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
        }),
      ),
  });

  /**
   * The last list that arrived. The resource drops its value while it fetches for new
   * params; the cards stay on screen meanwhile. A failure forgets them, so a retry
   * shows the loading state.
   */
  private readonly lastPage = linkedSignal<
    { failed: boolean; page: CardPage | undefined },
    CardPage | undefined
  >({
    source: () => ({
      failed: this.cards.status() === 'error',
      // `value()` throws while the resource is in its error state.
      page: this.cards.hasValue() ? this.cards.value() : undefined,
    }),
    computation: ({ failed, page }, previous) => {
      if (failed) return undefined;
      return page ?? previous?.value;
    },
  });

  protected readonly items = computed(() => this.lastPage()?.content ?? []);

  protected readonly view = computed(() => {
    // Read first, so that it sees every state the resource goes through.
    const page = this.lastPage();
    if (this.cards.status() === 'error') return 'error';
    if (!page) return 'loading';
    return page.content.length === 0 ? 'empty' : 'grid';
  });

  protected readonly announcement = signal('');

  /** An order the user just chose, until its list is on screen and announced. */
  private sortToAnnounce?: CardSort;

  /** A star that had focus when its card changed: moving it in the list drops the focus. */
  private starToRefocus?: HTMLButtonElement;

  constructor() {
    afterRenderEffect(() => {
      this.items(); // Runs again once a new list is on screen.
      // While fetching, the old list is still shown; after a failure there is none.
      if (this.cards.status() !== 'resolved') return;
      this.restoreStarFocus();
      this.announceSort();
    });
  }

  protected chooseSort(sort: CardSort): void {
    // Emptied first, so that a text announced before is announced again.
    this.announcement.set('');
    this.sortToAnnounce = sort;
    this.preference.choose(sort);
  }

  protected toggleFavorite(card: Card, star: HTMLButtonElement): void {
    this.favoriteChange(card).subscribe({
      next: () => {
        if (this.document.activeElement === star) this.starToRefocus = star;
        this.revision.update((revision) => revision + 1);
      },
      // The interceptor tells the user; the list stays as it was.
      error: (error: unknown) =>
        console.warn('Could not change the favorite', error),
    });
  }

  private favoriteChange(card: Card) {
    if (card.favorite) return this.api.unmarkCardFavorite(card.id);
    return this.api.markCardFavorite(card.id);
  }

  private restoreStarFocus(): void {
    const star = this.starToRefocus;
    if (!star) return;
    this.starToRefocus = undefined;
    // Only when the focus was lost: never take it from where the user went since.
    if (this.document.activeElement === this.document.body) star.focus();
  }

  private announceSort(): void {
    const sort = this.sortToAnnounce;
    if (!sort) return;
    this.sortToAnnounce = undefined;
    const count = this.items().length;
    const cards = count === 1 ? '1 card' : `${count} cards`;
    this.announcement.set(`${CARD_SORT_ANNOUNCEMENTS[sort]}, ${cards}`);
  }
}

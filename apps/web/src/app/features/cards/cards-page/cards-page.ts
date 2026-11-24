import { HttpContext } from '@angular/common/http';
import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardsService } from '@ccards/api-client';
import { firstValueFrom } from 'rxjs';
import { SKIP_ERROR_NOTIFICATION } from '../../../core/http/error.interceptor';
import { LoadingIndicator, StateMessage } from '@ui';
import { CardTile } from '../card-tile/card-tile';

const PAGE_SIZE = 100;

/** The card overview: fetches the cards and shows loading, error, empty or the grid. */
@Component({
  selector: 'app-cards-page',
  imports: [CardTile, LoadingIndicator, RouterLink, StateMessage],
  template: `
    <header class="brand">
      <img src="favicon.svg" alt="" width="32" height="32" />
      <span class="brand-name">ccards</span>
    </header>
    <div class="title-row">
      <h1>My cards</h1>
      <a class="add" role="button" routerLink="/cards/new">Add card</a>
    </div>
    @switch (cards.status()) {
      @case ('loading') {
        <app-loading-indicator message="Loading cards…" />
      }
      @case ('reloading') {
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
      @default {
        @if (items().length === 0) {
          <app-state-message message="You have no cards yet." />
        } @else {
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
                <a
                  class="edit"
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
    }
  `,
  styleUrl: './cards-page.css',
})
export class CardsPage {
  private readonly api = inject(CardsService);

  protected readonly cards = resource({
    // The page shows its own error state, so no toast for the same failure.
    loader: () =>
      firstValueFrom(
        this.api.listCards(0, PAGE_SIZE, 'body', false, {
          context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
        }),
      ),
  });

  protected readonly items = computed(() => this.cards.value()?.content ?? []);
}

import { HttpContext } from '@angular/common/http';
import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardsService } from '@ccards/api-client';
import { firstValueFrom } from 'rxjs';
import { SKIP_ERROR_NOTIFICATION } from '../../../core/http/error.interceptor';
import { StateMessage } from '../../../ui';
import { CardTile } from '../card-tile/card-tile';

const PAGE_SIZE = 100;

/** The card overview: fetches the cards and shows loading, error, empty or the grid. */
@Component({
  selector: 'app-cards-page',
  imports: [CardTile, RouterLink, StateMessage],
  template: `
    <h1>My cards</h1>
    <a routerLink="/cards/new">Add card</a>
    @switch (cards.status()) {
      @case ('loading') {
        <p role="status">Loading cards…</p>
      }
      @case ('reloading') {
        <p role="status">Loading cards…</p>
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
                  [routerLink]="['/cards', card.id, 'edit']"
                  [attr.aria-label]="'Edit ' + card.name"
                >
                  <app-card-tile
                    [name]="card.name"
                    [store]="card.store"
                    [color]="card.color"
                  />
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

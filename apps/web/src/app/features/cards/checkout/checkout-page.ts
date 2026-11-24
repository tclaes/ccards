import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardsService } from '@ccards/api-client';
import { LoadingIndicator, NotFound, StateMessage } from '@ui';
import { firstValueFrom, map } from 'rxjs';
import { SKIP_ERROR_NOTIFICATION } from '../../../core/http/error.interceptor';
import { keepScreenAwake } from '../../../core/wake-lock/wake-lock';
import { CheckoutBarcode } from './checkout-barcode';

/** Shows one card's barcode full screen for scanning at the till, with the screen kept on. */
@Component({
  selector: 'app-checkout-page',
  imports: [
    CheckoutBarcode,
    LoadingIndicator,
    NotFound,
    RouterLink,
    StateMessage,
  ],
  template: `
    <a routerLink="/cards">Back to cards</a>
    @switch (view()) {
      @case ('loading') {
        <app-loading-indicator message="Loading card…" />
      }
      @case ('not-found') {
        <app-not-found
          message="This card does not exist (anymore)."
          linkLabel="Back to cards"
          linkTo="/cards"
        />
      }
      @case ('error') {
        <app-state-message
          announce="alert"
          message="We could not load this card."
          actionLabel="Try again"
          (action)="card.reload()"
        />
      }
      @default {
        @if (card.value(); as shown) {
          <h1>{{ shown.name }}</h1>
          <app-checkout-barcode
            [src]="'/api/cards/' + shown.id + '/barcode?format=svg'"
            [number]="shown.cardNumber"
            [name]="shown.name"
          />
        }
      }
    }
  `,
  styleUrl: './checkout-page.css',
})
export class CheckoutPage {
  private readonly api = inject(CardsService);

  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? undefined)),
  );

  protected readonly card = resource({
    params: () => this.id(),
    loader: ({ params }) =>
      firstValueFrom(
        // The page shows its own error state, so no toast for the same failure.
        this.api.getCard(params, 'body', false, {
          context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
        }),
      ),
  });

  protected readonly view = computed(() => {
    if (this.isNotFound()) return 'not-found';
    if (this.card.error()) return 'error';
    return this.card.isLoading() ? 'loading' : 'card';
  });

  constructor() {
    keepScreenAwake();
  }

  private isNotFound(): boolean {
    const error = this.card.error();
    // Depending on how the resource wraps a failure, the HTTP error is the error or its cause.
    const http = error instanceof HttpErrorResponse ? error : error?.cause;
    return http instanceof HttpErrorResponse && http.status === 404;
  }
}

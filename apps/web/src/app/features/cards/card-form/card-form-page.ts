import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CardsService } from '@ccards/api-client';
import type { Card } from '@ccards/api-client';
import { firstValueFrom, map } from 'rxjs';
import {
  SKIP_ERROR_NOTIFICATION,
  describeHttpError,
  isValidationProblem,
} from '../../../core/http/error.interceptor';
import { NotificationService } from '../../../core/notification/notification.service';
import { ConfirmDialog } from '@ui';
import { CardForm } from './card-form';
import {
  type CardFormValue,
  EMPTY_CARD_FORM,
  type FormProblem,
  toCardInput,
  toCardPatch,
  toFormValue,
} from './card-form.model';
import { CardLoadError } from './card-load-error';
import { CardLoading } from './card-loading';
import { CardNotFound } from './card-not-found';

const CONFLICT_MESSAGE =
  'This card was changed elsewhere. Reload it to see the latest version, then try again.';

/** Adds a card (`/cards/new`) or edits one (`/cards/:id/edit`). */
@Component({
  selector: 'app-card-form-page',
  imports: [CardForm, CardLoadError, CardLoading, CardNotFound, ConfirmDialog],
  template: `
    <h1>{{ id() ? 'Edit card' : 'Add card' }}</h1>
    @switch (view()) {
      @case ('not-found') {
        <app-card-not-found />
      }
      @case ('error') {
        <app-card-load-error (retry)="card.reload()" />
      }
      @case ('loading') {
        <app-card-loading />
      }
      @case ('form') {
        <app-card-form
          [value]="formValue()"
          [editing]="!!id()"
          [save]="save"
          (deleteRequested)="confirmingDelete.set(true)"
          (reloadRequested)="card.reload()"
        />
        @if (card.value(); as saved) {
          <app-confirm-dialog
            [open]="confirmingDelete()"
            [title]="'Delete ' + saved.name + '?'"
            message="This cannot be undone."
            confirmLabel="Delete"
            (confirmed)="remove(saved.id)"
            (cancelled)="confirmingDelete.set(false)"
          />
        }
      }
    }
  `,
  styleUrl: './card-form-page.css',
})
export class CardFormPage {
  private readonly api = inject(CardsService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  /**
   * The `:id` path parameter; absent on `/cards/new`. Read from the route, not bound
   * as an input, because input binding would also accept `?id=` from the query string.
   */
  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? undefined)),
  );

  protected readonly confirmingDelete = signal(false);

  protected readonly card = resource({
    params: () => this.id(),
    // The page shows its own states, so no toast for a failed load.
    loader: ({ params }) =>
      firstValueFrom(
        this.api.getCard(params, 'body', false, {
          context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
        }),
      ),
  });

  protected readonly view = computed(() => {
    if (this.isNotFound()) return 'not-found';
    if (this.card.error()) return 'error';
    // Also while reloading, so nothing typed now is replaced when the reload ends.
    if (this.id() && this.card.isLoading()) return 'loading';
    return 'form';
  });

  protected readonly formValue = computed<CardFormValue>(() =>
    // `value()` throws while the resource is in its error state.
    this.card.hasValue() ? toFormValue(this.card.value()) : EMPTY_CARD_FORM,
  );

  protected readonly save = (value: CardFormValue) => this.persist(value);

  private isNotFound(): boolean {
    const error = this.card.error();
    // Depending on how the resource wraps a failure, the HTTP error is the error or its cause.
    const http = error instanceof HttpErrorResponse ? error : error?.cause;
    return http instanceof HttpErrorResponse && http.status === 404;
  }

  protected async remove(id: string): Promise<void> {
    this.confirmingDelete.set(false);
    try {
      await firstValueFrom(
        this.api.deleteCard(id, 'body', false, {
          context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
        }),
      );
    } catch (error) {
      this.notifyFailure(error);
      return;
    }
    await this.router.navigate(['/cards']);
  }

  private async persist(value: CardFormValue): Promise<readonly FormProblem[]> {
    const saved = this.card.hasValue() ? this.card.value() : undefined;
    try {
      await (saved ? this.update(saved, value) : this.create(value));
    } catch (error) {
      return this.problemsFrom(error);
    }
    this.notifications.success('Card saved');
    await this.router.navigate(['/cards']);
    return [];
  }

  private async create(value: CardFormValue): Promise<void> {
    await firstValueFrom(
      this.api.createCard(toCardInput(value), 'body', false, {
        context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
      }),
    );
  }

  private async update(saved: Card, value: CardFormValue): Promise<void> {
    const patch = toCardPatch(saved, value);
    // Only `version` left: nothing changed, so there is nothing to send.
    if (Object.keys(patch).length === 1) return;
    await firstValueFrom(
      this.api.patchCard(saved.id, patch, 'body', false, {
        context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
      }),
    );
  }

  /** What the form should show for a failed save; failures that are not about the form are notified. */
  private problemsFrom(error: unknown): readonly FormProblem[] {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return [{ message: CONFLICT_MESSAGE }];
    }
    if (
      error instanceof HttpErrorResponse &&
      error.status === 400 &&
      isValidationProblem(error.error)
    ) {
      return error.error.errors;
    }
    this.notifyFailure(error);
    return [];
  }

  /** Our own calls opt out of the interceptor's toast, so a failure we do not show elsewhere is notified here. */
  private notifyFailure(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) throw error;
    this.notifications.error(describeHttpError(error));
  }
}

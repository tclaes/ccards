import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  inject,
  input,
  linkedSignal,
  resource,
  signal,
} from '@angular/core';
import {
  FormField,
  type FieldTree,
  type SchemaPath,
  type TreeValidationResult,
  form,
  maxLength,
  requiredError,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { CardsService } from '@ccards/api-client';
import { firstValueFrom } from 'rxjs';
import {
  SKIP_ERROR_NOTIFICATION,
  describeHttpError,
  isValidationProblem,
} from '../../../core/http/error.interceptor';
import { NotificationService } from '../../../core/notification/notification.service';
import { ConfirmDialog } from '../../../ui';
import { cardNumberError } from './card-number';
import {
  BARCODE_TYPE_OPTIONS,
  type CardFormValue,
  EMPTY_CARD_FORM,
  toCardInput,
  toCardPatch,
  toFormValue,
} from './card-form.model';
import { FieldErrors } from './field-errors';
import { splitViolations } from './server-errors';

const FORM_FIELDS = Object.keys(EMPTY_CARD_FORM);
const CONFLICT_MESSAGE =
  'This card was changed elsewhere. Reload it to see the latest version, then try again.';

function notBlank(path: SchemaPath<string>, label: string): void {
  validate(path, ({ value }) =>
    value().trim() === ''
      ? requiredError({ message: `${label} is required` })
      : undefined,
  );
}

function atMost(path: SchemaPath<string>, max: number, label: string): void {
  maxLength(path, max, {
    message: `${label} can have at most ${max} characters`,
  });
}

/** Adds a card (`/cards/new`) or edits one (`/cards/:id/edit`). */
@Component({
  selector: 'app-card-form-page',
  imports: [ConfirmDialog, FieldErrors, FormField, RouterLink],
  template: `
    <h1>{{ id() ? 'Edit card' : 'Add card' }}</h1>
    @if (isNotFound()) {
      <p role="alert">This card does not exist (anymore).</p>
      <a routerLink="/cards">Back to cards</a>
    } @else if (card.error()) {
      <p role="alert">We could not load this card.</p>
      <button type="button" (click)="card.reload()">Try again</button>
    } @else if (id() && !card.value()) {
      <p role="status">Loading card…</p>
    } @else {
      <form novalidate (submit)="save($event)">
        @if (form().errors().length) {
          <div role="alert">
            @for (error of form().errors(); track $index) {
              <p>{{ error.message }}</p>
            }
            @if (id()) {
              <button type="button" (click)="card.reload()">Reload card</button>
            }
          </div>
        }

        <label>
          Name
          <input
            type="text"
            aria-required="true"
            [formField]="form.name"
            [attr.aria-invalid]="invalidMark(form.name)"
            [attr.aria-describedby]="
              showsErrors(form.name) ? 'name-errors' : null
            "
          />
        </label>
        @if (showsErrors(form.name)) {
          <app-field-errors id="name-errors" [errors]="form.name().errors()" />
        }

        <label>
          Store
          <input
            type="text"
            aria-required="true"
            [formField]="form.store"
            [attr.aria-invalid]="invalidMark(form.store)"
            [attr.aria-describedby]="
              showsErrors(form.store) ? 'store-errors' : null
            "
          />
        </label>
        @if (showsErrors(form.store)) {
          <app-field-errors
            id="store-errors"
            [errors]="form.store().errors()"
          />
        }

        <label>
          Barcode type
          <select [formField]="form.barcodeType">
            @for (option of barcodeTypes; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </label>

        <label>
          Card number
          <input
            type="text"
            aria-required="true"
            [formField]="form.cardNumber"
            [attr.aria-invalid]="invalidMark(form.cardNumber)"
            [attr.aria-describedby]="
              showsErrors(form.cardNumber) ? 'cardNumber-errors' : null
            "
          />
        </label>
        @if (showsErrors(form.cardNumber)) {
          <app-field-errors
            id="cardNumber-errors"
            [errors]="form.cardNumber().errors()"
          />
        }

        <label>
          Colour (optional, for example #ff8800)
          <input
            type="text"
            [formField]="form.color"
            [attr.aria-invalid]="invalidMark(form.color)"
            [attr.aria-describedby]="
              showsErrors(form.color) ? 'color-errors' : null
            "
          />
        </label>
        @if (showsErrors(form.color)) {
          <app-field-errors
            id="color-errors"
            [errors]="form.color().errors()"
          />
        }

        <label>
          Note (optional)
          <textarea
            [formField]="form.note"
            [attr.aria-invalid]="invalidMark(form.note)"
            [attr.aria-describedby]="
              showsErrors(form.note) ? 'note-errors' : null
            "
          ></textarea>
        </label>
        @if (showsErrors(form.note)) {
          <app-field-errors id="note-errors" [errors]="form.note().errors()" />
        }

        <div class="actions">
          <button type="submit" [disabled]="form().submitting()">Save</button>
          <a routerLink="/cards">Cancel</a>
          @if (card.value(); as saved) {
            <button
              type="button"
              class="secondary"
              (click)="confirmingDelete.set(true)"
            >
              Delete
            </button>
            <app-confirm-dialog
              [open]="confirmingDelete()"
              [title]="'Delete ' + saved.name + '?'"
              message="This cannot be undone."
              confirmLabel="Delete"
              (confirmed)="remove(saved.id)"
              (cancelled)="confirmingDelete.set(false)"
            />
          }
        </div>
      </form>
    }
  `,
  styleUrl: './card-form-page.css',
})
export class CardFormPage {
  private readonly api = inject(CardsService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  /** Route parameter; absent on `/cards/new`. */
  readonly id = input<string>();

  protected readonly barcodeTypes = BARCODE_TYPE_OPTIONS;
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

  private readonly model = linkedSignal<CardFormValue>(() => {
    // `value()` throws while the resource is in its error state.
    return this.card.hasValue()
      ? toFormValue(this.card.value())
      : EMPTY_CARD_FORM;
  });

  protected readonly form = form(this.model, (path) => {
    notBlank(path.name, 'Name');
    atMost(path.name, 100, 'Name');
    notBlank(path.store, 'Store');
    atMost(path.store, 100, 'Store');
    notBlank(path.cardNumber, 'Card number');
    atMost(path.cardNumber, 100, 'Card number');
    atMost(path.color, 32, 'Colour');
    atMost(path.note, 1000, 'Note');
    // Reads the type too, so changing the type re-checks the number.
    validate(path.cardNumber, ({ value, valueOf }) => {
      const message = cardNumberError(valueOf(path.barcodeType), value());
      return message ? { kind: 'cardNumber', message } : undefined;
    });
  });

  protected isNotFound(): boolean {
    const error = this.card.error();
    // Depending on how the resource wraps a failure, the HTTP error is the error or its cause.
    const http = error instanceof HttpErrorResponse ? error : error?.cause;
    return http instanceof HttpErrorResponse && http.status === 404;
  }

  /** `true` while errors show; absent otherwise, so Pico does not draw a "valid" tick. */
  protected invalidMark(field: FieldTree<string>): true | null {
    return this.showsErrors(field) ? true : null;
  }

  protected showsErrors(field: FieldTree<string>): boolean {
    return field().touched() && field().invalid();
  }

  protected save(event: Event): void {
    event.preventDefault();
    void submit(this.form, {
      action: () => this.persist(),
      onInvalid: (field) =>
        field().errorSummary()[0]?.fieldTree().focusBoundControl(),
    });
  }

  protected async remove(id: string): Promise<void> {
    this.confirmingDelete.set(false);
    try {
      await firstValueFrom(this.api.deleteCard(id));
    } catch {
      // The interceptor already showed the error; stay on the page.
      return;
    }
    await this.router.navigate(['/cards']);
  }

  private async persist(): Promise<TreeValidationResult> {
    const context = new HttpContext().set(SKIP_ERROR_NOTIFICATION, true);
    const value = this.form().value();
    const saved = this.card.value();
    try {
      if (!saved) {
        await firstValueFrom(
          this.api.createCard(toCardInput(value), 'body', false, { context }),
        );
      } else {
        const patch = toCardPatch(saved, value);
        // Only `version` left: nothing changed, so there is nothing to send.
        if (Object.keys(patch).length > 1) {
          await firstValueFrom(
            this.api.patchCard(saved.id, patch, 'body', false, { context }),
          );
        }
      }
    } catch (error) {
      return this.rejection(error);
    }
    this.notifications.success('Card saved');
    await this.router.navigate(['/cards']);
    return undefined;
  }

  /** Turns a failed save into form errors, or a notification when it is not about the form. */
  private rejection(error: unknown): TreeValidationResult {
    if (!(error instanceof HttpErrorResponse)) throw error;
    if (error.status === 409) {
      return { kind: 'conflict', message: CONFLICT_MESSAGE };
    }
    if (error.status === 400 && isValidationProblem(error.error)) {
      const { forFields, other } = splitViolations(
        error.error.errors,
        FORM_FIELDS,
      );
      return [
        ...forFields.map((v) => ({
          fieldTree: this.form[v.field as keyof CardFormValue],
          kind: 'server',
          message: v.message,
        })),
        ...other.map((v) => ({
          kind: 'server',
          message: `${v.field}: ${v.message}`,
        })),
      ];
    }
    this.notifications.error(describeHttpError(error));
    return undefined;
  }
}

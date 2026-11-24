import { Component, input, linkedSignal, output } from '@angular/core';
import {
  type TreeValidationResult,
  form,
  maxLength,
  submit,
  validate,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { requiredText } from '@shared/utils/form/required-text';
import { InputField, SelectField, TextareaField } from '@ui';
import { cardNumberError } from './card-number';
import {
  BARCODE_TYPE_OPTIONS,
  type CardFormValue,
  EMPTY_CARD_FORM,
  type FormProblem,
} from './card-form.model';

function formField(name: string | undefined): keyof CardFormValue | undefined {
  return name !== undefined && name in EMPTY_CARD_FORM
    ? (name as keyof CardFormValue)
    : undefined;
}

/**
 * The card fields with their validation. Dumb: it knows nothing about HTTP.
 * `save` is a function rather than an output because its outcome (the problems
 * the server found) has to flow back into the submit to show them at the fields.
 */
@Component({
  selector: 'app-card-form',
  imports: [InputField, RouterLink, SelectField, TextareaField],
  template: `
    <form novalidate (submit)="submit($event)">
      @if (form().errors().length) {
        <div role="alert">
          @for (error of form().errors(); track $index) {
            <p>{{ error.message }}</p>
          }
          @if (editing()) {
            <button type="button" (click)="reloadRequested.emit()">
              Reload card
            </button>
          }
        </div>
      }

      <app-input-field label="Name" [field]="form.name" />

      <app-input-field label="Store" [field]="form.store" />

      <app-select-field
        label="Barcode type"
        [field]="form.barcodeType"
        [options]="barcodeTypes"
      />

      <app-input-field label="Card number" [field]="form.cardNumber" />

      <app-input-field
        label="Colour (optional, for example #ff8800)"
        [field]="form.color"
      />

      <app-textarea-field label="Note (optional)" [field]="form.note" />

      <div class="actions">
        <button type="submit" [disabled]="form().submitting()">Save</button>
        <a routerLink="/cards">Cancel</a>
        @if (editing()) {
          <button
            type="button"
            class="secondary"
            (click)="deleteRequested.emit()"
          >
            Delete
          </button>
        }
      </div>
    </form>
  `,
  styleUrl: './card-form.css',
})
export class CardForm {
  /** The values to start from; a new value resets the form. */
  readonly value = input.required<CardFormValue>();
  /** An existing card: offers delete and reload. */
  readonly editing = input(false);
  /** Saves the values and returns what is wrong with them; empty means nothing to show. */
  readonly save =
    input.required<(value: CardFormValue) => Promise<readonly FormProblem[]>>();
  readonly deleteRequested = output<void>();
  readonly reloadRequested = output<void>();

  protected readonly barcodeTypes = BARCODE_TYPE_OPTIONS;

  private readonly model = linkedSignal<CardFormValue>(() => this.value());

  protected readonly form = form(this.model, (path) => {
    requiredText(path.name, 'Name');
    maxLength(path.name, 100, {
      message: 'Name can have at most 100 characters',
    });
    requiredText(path.store, 'Store');
    maxLength(path.store, 100, {
      message: 'Store can have at most 100 characters',
    });
    requiredText(path.cardNumber, 'Card number');
    maxLength(path.cardNumber, 100, {
      message: 'Card number can have at most 100 characters',
    });
    maxLength(path.color, 32, {
      message: 'Colour can have at most 32 characters',
    });
    maxLength(path.note, 1000, {
      message: 'Note can have at most 1000 characters',
    });
    // Reads the type too, so changing the type re-checks the number.
    validate(path.cardNumber, ({ value, valueOf }) => {
      const message = cardNumberError(valueOf(path.barcodeType), value());
      return message ? { kind: 'cardNumber', message } : undefined;
    });
  });

  protected submit(event: Event): void {
    event.preventDefault();
    void submit(this.form, {
      action: async () => this.toErrors(await this.save()(this.form().value())),
      onInvalid: (field) =>
        field().errorSummary()[0]?.fieldTree().focusBoundControl(),
    });
  }

  /** A problem for a field on the form shows at that field, any other in the form's own area. */
  private toErrors(problems: readonly FormProblem[]): TreeValidationResult {
    return problems.map((problem) => {
      const field = formField(problem.field);
      if (field) {
        return {
          fieldTree: this.form[field],
          kind: 'server',
          message: problem.message,
        };
      }
      const prefix = problem.field ? `${problem.field}: ` : '';
      return { kind: 'server', message: prefix + problem.message };
    });
  }
}

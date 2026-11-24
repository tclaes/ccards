import { Component, input, linkedSignal, output } from '@angular/core';
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
import { RouterLink } from '@angular/router';
import { cardNumberError } from './card-number';
import {
  BARCODE_TYPE_OPTIONS,
  type CardFormValue,
  EMPTY_CARD_FORM,
  type FormProblem,
} from './card-form.model';
import { FieldErrors } from './field-errors';

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
  imports: [FieldErrors, FormField, RouterLink],
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
        <app-field-errors id="store-errors" [errors]="form.store().errors()" />
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
        <app-field-errors id="color-errors" [errors]="form.color().errors()" />
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

  /** `true` while errors show; absent otherwise, so Pico does not draw a "valid" tick. */
  protected invalidMark(field: FieldTree<string>): true | null {
    return this.showsErrors(field) ? true : null;
  }

  protected showsErrors(field: FieldTree<string>): boolean {
    return field().touched() && field().invalid();
  }

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

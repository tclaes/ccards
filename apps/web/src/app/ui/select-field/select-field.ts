import { Component, input } from '@angular/core';
import { type FieldTree, FormField } from '@angular/forms/signals';
import { FieldErrors } from '../field-errors/field-errors';
import { fieldErrorState } from '../field-errors/field-error-state';

/** A labelled select with its validation errors, bound to a Signal Forms field. */
@Component({
  selector: 'app-select-field',
  imports: [FieldErrors, FormField],
  template: `
    <label>
      {{ label() }}
      <select
        [formField]="field()"
        [attr.aria-invalid]="errors.invalidMark()"
        [attr.aria-describedby]="errors.describedBy()"
      >
        @for (option of options(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </label>
    @if (errors.showsErrors()) {
      <app-field-errors [id]="errors.errorId" [errors]="field()().errors()" />
    }
  `,
})
export class SelectField {
  readonly label = input.required<string>();
  readonly field = input.required<FieldTree<string>>();

  protected readonly errors = fieldErrorState(this.field);

  readonly options =
    input.required<readonly { value: string; label: string }[]>();
}

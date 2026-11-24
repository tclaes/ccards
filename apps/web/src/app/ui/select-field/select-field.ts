import { Component, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { FieldErrors } from '../field-errors/field-errors';
import { LabelledField } from '../labelled-field/labelled-field';

/** A labelled select with its validation errors, bound to a Signal Forms field. */
@Component({
  selector: 'app-select-field',
  imports: [FieldErrors, FormField],
  template: `
    <label>
      {{ label() }}
      <select
        [formField]="field()"
        [attr.aria-invalid]="invalidMark()"
        [attr.aria-describedby]="describedBy()"
      >
        @for (option of options(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </label>
    @if (showsErrors()) {
      <app-field-errors [id]="errorId" [errors]="field()().errors()" />
    }
  `,
})
export class SelectField extends LabelledField {
  readonly options =
    input.required<readonly { value: string; label: string }[]>();
}

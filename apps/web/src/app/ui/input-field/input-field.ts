import { Component } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { FieldErrors } from '../field-errors/field-errors';
import { LabelledField } from '../labelled-field/labelled-field';

/** A labelled single-line text input with its validation errors, bound to a Signal Forms field. */
@Component({
  selector: 'app-input-field',
  imports: [FieldErrors, FormField],
  template: `
    <label>
      {{ label() }}
      <input
        type="text"
        [formField]="field()"
        [attr.aria-invalid]="invalidMark()"
        [attr.aria-describedby]="describedBy()"
      />
    </label>
    @if (showsErrors()) {
      <app-field-errors [id]="errorId" [errors]="field()().errors()" />
    }
  `,
})
export class InputField extends LabelledField {}

import { Component, input } from '@angular/core';
import { type FieldTree, FormField } from '@angular/forms/signals';
import { FieldErrors } from '../field-errors/field-errors';
import { fieldErrorState } from '../field-errors/field-error-state';

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
        [attr.aria-invalid]="errors.invalidMark()"
        [attr.aria-describedby]="errors.describedBy()"
      />
    </label>
    @if (errors.showsErrors()) {
      <app-field-errors [id]="errors.errorId" [errors]="field()().errors()" />
    }
  `,
})
export class InputField {
  readonly label = input.required<string>();
  readonly field = input.required<FieldTree<string>>();

  protected readonly errors = fieldErrorState(this.field);
}

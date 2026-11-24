import { Component, input } from '@angular/core';
import { type FieldTree, FormField } from '@angular/forms/signals';
import { FieldErrors } from '../field-errors/field-errors';
import { fieldErrorState } from '../field-errors/field-error-state';

/** A labelled multi-line text field with its validation errors, bound to a Signal Forms field. */
@Component({
  selector: 'app-textarea-field',
  imports: [FieldErrors, FormField],
  template: `
    <label>
      {{ label() }}
      <textarea
        [formField]="field()"
        [attr.aria-invalid]="errors.invalidMark()"
        [attr.aria-describedby]="errors.describedBy()"
      ></textarea>
    </label>
    @if (errors.showsErrors()) {
      <app-field-errors [id]="errors.errorId" [errors]="field()().errors()" />
    }
  `,
})
export class TextareaField {
  readonly label = input.required<string>();
  readonly field = input.required<FieldTree<string>>();

  protected readonly errors = fieldErrorState(this.field);
}

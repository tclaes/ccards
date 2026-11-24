import { Component } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { FieldErrors } from '../field-errors/field-errors';
import { LabelledField } from '../labelled-field/labelled-field';

/** A labelled multi-line text field with its validation errors, bound to a Signal Forms field. */
@Component({
  selector: 'app-textarea-field',
  imports: [FieldErrors, FormField],
  template: `
    <label>
      {{ label() }}
      <textarea
        [formField]="field()"
        [attr.aria-invalid]="invalidMark()"
        [attr.aria-describedby]="describedBy()"
      ></textarea>
    </label>
    @if (showsErrors()) {
      <app-field-errors [id]="errorId" [errors]="field()().errors()" />
    }
  `,
})
export class TextareaField extends LabelledField {}

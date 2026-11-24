import { Component, input } from '@angular/core';

/** The messages of one field's validation errors. Dumb: errors come in as input. */
@Component({
  selector: 'app-field-errors',
  template: `
    @for (error of errors(); track $index) {
      <small>{{ error.message }}</small>
    }
  `,
  styleUrl: './field-errors.css',
})
export class FieldErrors {
  readonly errors = input.required<readonly { readonly message?: string }[]>();
}

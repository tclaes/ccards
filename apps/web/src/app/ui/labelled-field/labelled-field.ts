import { Directive, computed, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';

let nextErrorId = 0;

/**
 * What a labelled form control needs: its label, the Signal Forms field it edits and
 * the accessibility state of that field's errors. Errors show once the user has
 * touched the field. Dumb: no services.
 */
@Directive()
export abstract class LabelledField {
  readonly label = input.required<string>();
  readonly field = input.required<FieldTree<string>>();

  protected readonly errorId = `field-errors-${nextErrorId++}`;

  protected readonly showsErrors = computed(() => {
    const state = this.field()();
    return state.touched() && state.invalid();
  });
  /** `true` while errors show; absent otherwise, so Pico does not draw a "valid" tick. */
  protected readonly invalidMark = computed(() =>
    this.showsErrors() ? true : null,
  );
  protected readonly describedBy = computed(() =>
    this.showsErrors() ? this.errorId : null,
  );
}

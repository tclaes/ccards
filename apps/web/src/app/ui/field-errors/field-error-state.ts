import { computed } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';

let nextErrorId = 0;

/**
 * The accessibility state of a form control's errors. Errors show once the user
 * has touched the field.
 */
export function fieldErrorState(field: () => FieldTree<string>) {
  const showsErrors = computed(() => {
    const state = field()();
    return state.touched() && state.invalid();
  });
  const errorId = `field-errors-${nextErrorId++}`;
  return {
    errorId,
    showsErrors,
    /** `true` while errors show; absent otherwise, so Pico does not draw a "valid" tick. */
    invalidMark: computed(() => (showsErrors() ? true : null)),
    describedBy: computed(() => (showsErrors() ? errorId : null)),
  };
}

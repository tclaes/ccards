import { Component } from '@angular/core';

/** Plain, borderless button. Dumb: no state, no services; use as `<button appButton>`. */
// Attribute selector on purpose: it enhances a native <button> so semantics,
// focus and form behaviour stay native (sanctioned by the Angular style guide).
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[appButton]',
  template: '<ng-content />',
  styleUrl: './button.css',
})
export class Button {}

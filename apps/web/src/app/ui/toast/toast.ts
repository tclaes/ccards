import { Component, input, output } from '@angular/core';
import { Button } from '../button/button';

/**
 * One message with a dismiss button. Dumb: everything comes in through inputs
 * and goes out through outputs; it never talks to a service.
 */
@Component({
  selector: 'app-toast',
  imports: [Button],
  template: `
    <span class="message">{{ message() }}</span>
    <button
      appButton
      type="button"
      aria-label="Dismiss notification"
      (click)="dismissed.emit()"
    >
      <span class="glyph" aria-hidden="true">×</span>
    </button>
  `,
  styleUrl: './toast.css',
  host: {
    role: 'alert',
    '(mouseenter)': 'paused.emit()',
    '(mouseleave)': 'resumed.emit()',
    '(focusin)': 'paused.emit()',
    '(focusout)': 'resumed.emit()',
  },
})
export class Toast {
  readonly message = input.required<string>();
  /** The user asked to remove the toast. */
  readonly dismissed = output<void>();
  /** Hover or focus entered: the owner should stop any countdown. */
  readonly paused = output<void>();
  /** Hover and focus left: the owner may restart the countdown. */
  readonly resumed = output<void>();
}

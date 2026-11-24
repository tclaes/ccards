import { Component, input, output } from '@angular/core';
import { Button } from '../button/button';

/**
 * A short message for a page state (empty, failed), with an optional action
 * button. Dumb: everything comes in through inputs and goes out through outputs.
 */
@Component({
  selector: 'app-state-message',
  imports: [Button],
  template: `
    <p>{{ message() }}</p>
    @if (actionLabel(); as label) {
      <button appButton type="button" (click)="action.emit()">
        {{ label }}
      </button>
    }
  `,
  styleUrl: './state-message.css',
  host: { '[attr.role]': 'announce()' },
})
export class StateMessage {
  readonly message = input.required<string>();
  /** Label of the action button; without it no button is shown. */
  readonly actionLabel = input<string>();
  /** `alert` interrupts the screen reader (failures); `status` is polite. */
  readonly announce = input<'status' | 'alert'>('status');
  /** The user pressed the action button. */
  readonly action = output<void>();
}

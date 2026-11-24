import { Component, output } from '@angular/core';
import { StateMessage } from '@ui';

/** Shown when the card to edit could not be fetched. */
@Component({
  selector: 'app-card-load-error',
  imports: [StateMessage],
  template: `
    <app-state-message
      announce="alert"
      message="We could not load this card."
      actionLabel="Try again"
      (action)="retry.emit()"
    />
  `,
})
export class CardLoadError {
  readonly retry = output<void>();
}

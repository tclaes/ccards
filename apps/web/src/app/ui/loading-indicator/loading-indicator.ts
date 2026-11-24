import { Component, input } from '@angular/core';

/** Tells the user (and screen readers, politely) that something is loading. Dumb: one input. */
@Component({
  selector: 'app-loading-indicator',
  template: `{{ message() }}`,
  styleUrl: './loading-indicator.css',
  host: { role: 'status' },
})
export class LoadingIndicator {
  readonly message = input('Loading…');
}

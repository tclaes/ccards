import { Component } from '@angular/core';

/** Shown while the card to edit is being fetched. */
@Component({
  selector: 'app-card-loading',
  template: `<p role="status">Loading card…</p>`,
})
export class CardLoading {}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Shown when the card to edit does not exist (any more). */
@Component({
  selector: 'app-card-not-found',
  imports: [RouterLink],
  template: `
    <p role="alert">This card does not exist (anymore).</p>
    <a routerLink="/cards">Back to cards</a>
  `,
})
export class CardNotFound {}

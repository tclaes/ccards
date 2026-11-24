import { Component, computed, input } from '@angular/core';
import { tileColors } from './tile-colors';

/** One loyalty card in its own colour. Dumb: plain inputs, no services. */
@Component({
  selector: 'app-card-tile',
  template: `
    <strong class="name">{{ name() }}</strong>
    <span class="store">{{ store() }}</span>
  `,
  styleUrl: './card-tile.css',
  host: {
    // Pico's light scheme inside the tile, so the dark text token stays dark in dark mode.
    'data-theme': 'light',
    '[style.background-color]': 'colors().background',
    '[style.color]': 'colors().text',
  },
})
export class CardTile {
  readonly name = input.required<string>();
  readonly store = input.required<string>();
  readonly color = input<string | null>();

  protected readonly colors = computed(() => tileColors(this.color()));
}

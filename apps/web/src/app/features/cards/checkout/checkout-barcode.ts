import { Component, computed, input, signal } from '@angular/core';
import { StateMessage } from '@ui';

/** A barcode image on a white frame with the card number below it. Dumb: plain inputs. */
@Component({
  selector: 'app-checkout-barcode',
  imports: [StateMessage],
  template: `
    @if (failed()) {
      <app-state-message
        announce="alert"
        message="The barcode could not be shown."
      />
    } @else {
      <img [src]="src()" [alt]="alt()" (error)="failed.set(true)" />
    }
    <p class="number">{{ number() }}</p>
  `,
  styleUrl: './checkout-barcode.css',
  host: {
    // Pico's light scheme, so the frame stays white (scannable) in dark mode.
    'data-theme': 'light',
  },
})
export class CheckoutBarcode {
  readonly src = input.required<string>();
  readonly number = input.required<string>();
  readonly name = input.required<string>();

  protected readonly failed = signal(false);
  protected readonly alt = computed(() => `Barcode of ${this.name()}`);
}

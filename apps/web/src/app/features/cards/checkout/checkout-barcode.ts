import { Component, input, signal } from '@angular/core';

/** A barcode image on a white frame with the card number below it. Dumb: plain inputs. */
@Component({
  selector: 'app-checkout-barcode',
  template: `
    @if (failed()) {
      <p role="status">The barcode could not be shown.</p>
    } @else {
      <img
        [src]="src()"
        [alt]="'Barcode of ' + name()"
        (error)="failed.set(true)"
      />
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
}

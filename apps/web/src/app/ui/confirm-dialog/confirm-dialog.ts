import {
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Button } from '../button/button';

/**
 * Asks the user to confirm before something irreversible. Dumb: the owner
 * controls `open` and reacts to `confirmed` and `cancelled`. Built on a native
 * modal <dialog>, which brings the focus trap, Escape and focus return.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [Button],
  template: `
    <dialog #dialog aria-labelledby="confirm-dialog-title" (close)="onClose()">
      <article>
        <h1 id="confirm-dialog-title">{{ title() }}</h1>
        <p>{{ message() }}</p>
        <form method="dialog">
          <button appButton type="submit" value="cancel" autofocus>
            Cancel
          </button>
          <button appButton type="submit" value="confirm">
            {{ confirmLabel() }}
          </button>
        </form>
      </article>
    </dialog>
  `,
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  readonly open = input.required<boolean>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  /** The user chose the confirm button. */
  readonly confirmed = output<void>();
  /** The user cancelled with the button or Escape. */
  readonly cancelled = output<void>();

  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() === dialog.open) return;
      if (this.open()) dialog.showModal();
      else dialog.close();
    });
  }

  protected onClose(): void {
    const dialog = this.dialog().nativeElement;
    const choice = dialog.returnValue;
    // Escape sets no value; reset so a stale value cannot leak into the next close.
    dialog.returnValue = '';
    if (choice === 'confirm') this.confirmed.emit();
    else this.cancelled.emit();
  }
}

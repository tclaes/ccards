import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';
import { DIALOG_CHOICE } from './confirm-dialog.model';

@Component({
  imports: [ConfirmDialog],
  template: `
    <app-confirm-dialog
      [open]="open()"
      title="Delete Clubkaart?"
      message="This cannot be undone."
      confirmLabel="Delete"
      (confirmed)="log.push('confirmed'); open.set(false)"
      (cancelled)="log.push('cancelled'); open.set(false)"
    />
  `,
})
class Host {
  readonly open = signal(false);
  readonly log: string[] = [];
}

// jsdom has no modal dialog behaviour, so stub the two methods the component uses.
// A <form method="dialog"> button sets `returnValue` and closes; tests do that by hand.
function stubDialog(): void {
  const proto = HTMLDialogElement.prototype;
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto.close = function (this: HTMLDialogElement, value?: string) {
    if (value !== undefined) this.returnValue = value;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<Host>;
  let dialog: HTMLDialogElement;

  beforeEach(async () => {
    stubDialog();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    dialog = (fixture.nativeElement as HTMLElement).querySelector('dialog')!;
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  const button = (value: string) =>
    dialog.querySelector<HTMLButtonElement>(`button[value="${value}"]`)!;
  const choose = (value: string) => dialog.close(value);

  it('opens as a modal with the title and message', () => {
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector('h1')?.textContent).toContain(
      'Delete Clubkaart?',
    );
    expect(dialog.textContent).toContain('cannot be undone');
    expect(button(DIALOG_CHOICE.confirm).textContent).toContain('Delete');
  });

  it('emits confirmed when the confirm button is used', () => {
    choose(DIALOG_CHOICE.confirm);
    expect(fixture.componentInstance.log).toEqual(['confirmed']);
  });

  it('emits cancelled for the cancel button', () => {
    choose(DIALOG_CHOICE.cancel);
    expect(fixture.componentInstance.log).toEqual(['cancelled']);
  });

  it('emits cancelled when closed without a choice, as Escape does', () => {
    dialog.close();
    expect(fixture.componentInstance.log).toEqual(['cancelled']);
  });

  it('does not leak a previous choice into the next close', () => {
    choose(DIALOG_CHOICE.confirm);
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    dialog.close();
    expect(fixture.componentInstance.log).toEqual(['confirmed', 'cancelled']);
  });

  it('closes when the owner sets open to false', () => {
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    expect(dialog.open).toBe(false);
  });
});

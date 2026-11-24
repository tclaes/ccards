import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, maxLength, required } from '@angular/forms/signals';
import { InputField } from './input-field';
import { TextareaField } from '../textarea-field/textarea-field';

@Component({
  imports: [InputField, TextareaField],
  template: `
    <app-input-field label="Name" [field]="f.name" />
    <app-textarea-field label="Note" [field]="f.note" />
  `,
})
class Host {
  protected readonly f = form(signal({ name: '', note: '' }), (path) => {
    required(path.name, { message: 'Name is required' });
    maxLength(path.note, 3, { message: 'Too long' });
  });
}

describe('InputField and TextareaField', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture;
  }

  const control = (el: HTMLElement, label: string) =>
    Array.from(el.querySelectorAll('label'))
      .find((l) => l.textContent?.trim() === label)!
      .querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input, textarea',
      )!;

  it('labels the control and shows no error before it is touched', async () => {
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;

    expect(control(el, 'Name').tagName).toBe('INPUT');
    expect(control(el, 'Note').tagName).toBe('TEXTAREA');
    expect(control(el, 'Name').hasAttribute('aria-invalid')).toBe(false);
    expect(el.querySelector('app-field-errors')).toBeNull();
  });

  it('shows the error after blur and ties it to the control', async () => {
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;

    control(el, 'Name').dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const name = control(el, 'Name');
    expect(name.getAttribute('aria-invalid')).toBe('true');
    const errors = el.querySelector(
      `#${name.getAttribute('aria-describedby')}`,
    );
    expect(errors?.textContent).toContain('Name is required');
  });

  it('shows a textarea error and clears it when the value is fixed', async () => {
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    const note = control(el, 'Note');

    note.value = 'too long';
    note.dispatchEvent(new Event('input'));
    note.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(el.textContent).toContain('Too long');

    note.value = 'ok';
    note.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Too long');
  });
});

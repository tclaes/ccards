import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StateMessage } from './state-message';

describe('StateMessage', () => {
  let fixture: ComponentFixture<StateMessage>;
  let el: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(StateMessage);
    fixture.componentRef.setInput('message', 'Nothing here');
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  });

  it('shows the message as a polite status without a button', () => {
    expect(el.textContent).toContain('Nothing here');
    expect(el.getAttribute('role')).toBe('status');
    expect(el.querySelector('button')).toBeNull();
  });

  it('can announce as an alert', () => {
    fixture.componentRef.setInput('announce', 'alert');
    fixture.detectChanges();
    expect(el.getAttribute('role')).toBe('alert');
  });

  it('shows the action button and emits action when pressed', () => {
    fixture.componentRef.setInput('actionLabel', 'Try again');
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.action.subscribe(spy);

    const button = el.querySelector('button');
    expect(button?.textContent).toContain('Try again');
    button?.click();
    expect(spy).toHaveBeenCalledOnce();
  });
});

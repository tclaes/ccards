import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Toast } from './toast';

describe('Toast', () => {
  let fixture: ComponentFixture<Toast>;
  let el: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(Toast);
    fixture.componentRef.setInput('message', 'Boom');
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  });

  it('is an alert showing the message', () => {
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.textContent).toContain('Boom');
  });

  it('emits dismissed from the button', () => {
    const spy = vi.fn();
    fixture.componentInstance.dismissed.subscribe(spy);
    el.querySelector('button')!.click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('emits paused and resumed for hover and focus', () => {
    const paused = vi.fn();
    const resumed = vi.fn();
    fixture.componentInstance.paused.subscribe(paused);
    fixture.componentInstance.resumed.subscribe(resumed);

    el.dispatchEvent(new MouseEvent('mouseenter'));
    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(paused).toHaveBeenCalledTimes(2);

    el.dispatchEvent(new MouseEvent('mouseleave'));
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(resumed).toHaveBeenCalledTimes(2);
  });
});

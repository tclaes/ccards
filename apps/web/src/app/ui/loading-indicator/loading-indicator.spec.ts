import { TestBed } from '@angular/core/testing';
import { LoadingIndicator } from './loading-indicator';

describe('LoadingIndicator', () => {
  it('announces a default message as a polite status', () => {
    const fixture = TestBed.createComponent(LoadingIndicator);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toBe('Loading…');
    expect(el.getAttribute('role')).toBe('status');
  });

  it('shows a custom message', () => {
    const fixture = TestBed.createComponent(LoadingIndicator);
    fixture.componentRef.setInput('message', 'Loading cards…');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toBe(
      'Loading cards…',
    );
  });
});

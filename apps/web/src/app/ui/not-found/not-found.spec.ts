import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFound } from './not-found';

describe('NotFound', () => {
  it('announces the message and links onwards', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(NotFound);
    fixture.componentRef.setInput('message', 'This card does not exist.');
    fixture.componentRef.setInput('linkLabel', 'Back to cards');
    fixture.componentRef.setInput('linkTo', '/cards');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.textContent).toContain('This card does not exist.');
    const link = el.querySelector('a');
    expect(link?.textContent).toBe('Back to cards');
    expect(link?.getAttribute('href')).toBe('/cards');
  });
});

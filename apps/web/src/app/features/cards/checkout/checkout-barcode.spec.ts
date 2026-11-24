import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckoutBarcode } from './checkout-barcode';

describe('CheckoutBarcode', () => {
  let fixture: ComponentFixture<CheckoutBarcode>;
  let el: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutBarcode);
    fixture.componentRef.setInput('src', '/api/cards/1/barcode?format=svg');
    fixture.componentRef.setInput('number', '5412345678900');
    fixture.componentRef.setInput('name', 'Clubkaart');
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  });

  it('shows the barcode image and the number', () => {
    const img = el.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/api/cards/1/barcode?format=svg');
    expect(img?.getAttribute('alt')).toBe('Barcode of Clubkaart');
    expect(el.querySelector('.number')?.textContent).toBe('5412345678900');
  });

  it('forces the light scheme so the frame stays white', () => {
    expect(el.getAttribute('data-theme')).toBe('light');
  });

  it('keeps the number readable and explains when the image fails', () => {
    el.querySelector('img')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('[role="status"]')?.textContent).toContain(
      'could not be shown',
    );
    expect(el.querySelector('.number')?.textContent).toBe('5412345678900');
  });
});

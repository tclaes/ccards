import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardTile } from './card-tile';

describe('CardTile', () => {
  let fixture: ComponentFixture<CardTile>;
  let el: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(CardTile);
    fixture.componentRef.setInput('name', 'Clubkaart');
    fixture.componentRef.setInput('store', 'Delhaize');
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  });

  it('shows the name and the store', () => {
    expect(el.textContent).toContain('Clubkaart');
    expect(el.textContent).toContain('Delhaize');
  });

  it('uses the card colour as background', () => {
    fixture.componentRef.setInput('color', '#e30613');
    fixture.detectChanges();
    expect(el.style.backgroundColor).toBe('rgb(227, 6, 19)');
  });

  it('uses the default tile colour when the card has none', () => {
    expect(el.style.backgroundColor).toBe('var(--color-tile-default)');
  });
});

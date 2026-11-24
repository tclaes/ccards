import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Card } from '@ccards/api-client';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { NotificationService } from '../../../core/notification/notification.service';
import { CardsPage } from './cards-page';

function card(name: string, store: string, color?: string): Card {
  return {
    id: name,
    name,
    store,
    color,
    cardNumber: '1',
    barcodeType: 'CODE_128',
    version: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  } as Card;
}

function page(content: Card[]) {
  return {
    content,
    page: 0,
    size: 100,
    totalElements: content.length,
    totalPages: 1,
  };
}

describe('CardsPage', () => {
  let fixture: ComponentFixture<CardsPage>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CardsPage);
    el = fixture.nativeElement as HTMLElement;
    await settle();
  });

  // Not whenStable(): a pending HTTP request keeps the app unstable.
  async function settle(): Promise<void> {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  const pendingRequest = () =>
    http.expectOne((r) => r.url.endsWith('/api/cards'));

  it('shows a loading indicator while the request is in flight', () => {
    expect(el.querySelector('[role="status"]')?.textContent).toContain(
      'Loading',
    );
    expect(el.querySelector('.grid')).toBeNull();
    expect(el.querySelector('app-state-message')).toBeNull();
    pendingRequest();
  });

  it('shows a tile per card with its colour', async () => {
    pendingRequest().flush(
      page([
        card('Clubkaart', 'Delhaize', '#e30613'),
        card('Bonus', 'Colruyt'),
      ]),
    );
    await settle();

    const tiles = el.querySelectorAll<HTMLElement>('app-card-tile');
    expect(tiles).toHaveLength(2);
    expect(tiles[0].textContent).toContain('Clubkaart');
    expect(tiles[0].textContent).toContain('Delhaize');
    expect(tiles[0].style.backgroundColor).toBe('rgb(227, 6, 19)');
    expect(tiles[1].style.backgroundColor).toBe('var(--color-tile-default)');
    expect(el.querySelector('[role="status"]')).toBeNull();
  });

  it('links to the add form, and per card to its checkout and its edit form', async () => {
    pendingRequest().flush(page([card('Clubkaart', 'Delhaize')]));
    await settle();

    expect(el.querySelector('a[href="/cards/new"]')?.textContent).toContain(
      'Add card',
    );
    expect(
      el.querySelector('a[aria-label="Open Clubkaart"]')?.getAttribute('href'),
    ).toBe('/cards/Clubkaart');
    expect(
      el.querySelector('a[aria-label="Edit Clubkaart"]')?.getAttribute('href'),
    ).toBe('/cards/Clubkaart/edit');
  });

  it('shows the empty state when there are no cards', async () => {
    pendingRequest().flush(page([]));
    await settle();

    expect(el.textContent).toContain('no cards yet');
    expect(el.querySelector('.grid')).toBeNull();
  });

  it('shows an error with a retry that loads again, without a toast', async () => {
    pendingRequest().flush(
      { title: 'Server error', status: 500 },
      { status: 500, statusText: 'Server Error' },
    );
    await settle();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'could not load',
    );
    expect(el.querySelector('.grid')).toBeNull();
    expect(TestBed.inject(NotificationService).notifications()).toEqual([]);

    el.querySelector('button')?.click();
    await settle();
    expect(el.querySelector('[role="status"]')?.textContent).toContain(
      'Loading',
    );

    pendingRequest().flush(page([card('Clubkaart', 'Delhaize')]));
    await settle();
    expect(el.querySelectorAll('app-card-tile')).toHaveLength(1);
  });
});

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import type { Card } from '@ccards/api-client';
import { of } from 'rxjs';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { NotificationService } from '../../../core/notification/notification.service';
import { CheckoutPage } from './checkout-page';

const CARD = {
  id: 'abc',
  name: 'Clubkaart',
  store: 'Delhaize',
  cardNumber: '5412345678900',
  barcodeType: 'EAN_13',
  version: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
} as Card;

describe('CheckoutPage', () => {
  let fixture: ComponentFixture<CheckoutPage>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const request = vi.fn(async () => ({
    released: false,
    release: async () => undefined,
  }));

  beforeEach(async () => {
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request },
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'abc' })) },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CheckoutPage);
    el = fixture.nativeElement as HTMLElement;
    await settle();
  });

  // Not whenStable(): a pending HTTP request keeps the app unstable.
  async function settle(): Promise<void> {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  afterEach(() => Reflect.deleteProperty(navigator, 'wakeLock'));

  const pendingRequest = () =>
    http.expectOne((r) => r.url.endsWith('/api/cards/abc'));

  it('shows a loading indicator and no barcode while the card loads', () => {
    expect(el.querySelector('[role="status"]')?.textContent).toContain(
      'Loading',
    );
    expect(el.querySelector('app-checkout-barcode')).toBeNull();
    pendingRequest();
  });

  it('shows the barcode image, the number and the name', async () => {
    pendingRequest().flush(CARD);
    await settle();

    expect(el.querySelector('h1')?.textContent).toBe('Clubkaart');
    expect(el.querySelector('img')?.getAttribute('src')).toBe(
      '/api/cards/abc/barcode?format=svg',
    );
    expect(el.querySelector('.number')?.textContent).toBe('5412345678900');
  });

  it('links back to the overview', () => {
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/cards');
    pendingRequest();
  });

  it('keeps the screen on', () => {
    expect(request).toHaveBeenCalledWith('screen');
    pendingRequest();
  });

  it('says the card does not exist for an unknown id', async () => {
    pendingRequest().flush(
      { title: 'Not found', status: 404 },
      { status: 404, statusText: 'Not Found' },
    );
    await settle();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'does not exist',
    );
    expect(el.querySelector('app-checkout-barcode')).toBeNull();
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/cards');
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
    expect(TestBed.inject(NotificationService).notifications()).toEqual([]);

    el.querySelector('button')?.click();
    await settle();
    pendingRequest().flush(CARD);
    await settle();
    expect(el.querySelector('app-checkout-barcode')).not.toBeNull();
  });
});

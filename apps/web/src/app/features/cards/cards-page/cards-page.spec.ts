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
    favorite: false,
    cardNumber: '1',
    barcodeType: 'CODE_128',
    version: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  } as Card;
}

function favorite(name: string): Card {
  return { ...card(name, `Store of ${name}`), favorite: true };
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

  afterEach(() => {
    el.remove();
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    localStorage.clear();
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
    // In the document, so that elements can take focus.
    document.body.append(el);
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

  async function showCards(...content: Card[]): Promise<void> {
    pendingRequest().flush(page(content));
    await settle();
  }

  const names = () =>
    Array.from(el.querySelectorAll('app-card-tile .name'), (name) =>
      name.textContent?.trim(),
    );

  const sortSelect = () => el.querySelector('select') as HTMLSelectElement;

  async function chooseSort(value: string): Promise<void> {
    sortSelect().value = value;
    sortSelect().dispatchEvent(new Event('change'));
    await settle();
  }

  const announcement = () =>
    el.querySelector('p[role="status"]')?.textContent?.trim();

  const star = (name: string) =>
    el.querySelector(
      `button[aria-label="Favorite ${name}"]`,
    ) as HTMLButtonElement;

  const favoriteRequest = (name: string) =>
    http.expectOne((r) => r.url.endsWith(`/api/cards/${name}/favorite`));

  /** Answers the favorite request of a card and returns its method. */
  async function answerFavorite(name: string): Promise<string> {
    const pending = favoriteRequest(name);
    pending.flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    return pending.request.method;
  }

  const serverError = [
    { title: 'Server error', status: 500 },
    { status: 500, statusText: 'Server Error' },
  ] as const;

  it('shows a loading indicator while the request is in flight', () => {
    expect(el.querySelector('app-loading-indicator')?.textContent).toContain(
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
    expect(el.querySelector('app-loading-indicator')).toBeNull();
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
    expect(el.querySelector('app-loading-indicator')?.textContent).toContain(
      'Loading',
    );

    pendingRequest().flush(page([card('Clubkaart', 'Delhaize')]));
    await settle();
    expect(el.querySelectorAll('app-card-tile')).toHaveLength(1);
  });

  it('offers to sort by name, last used and most used, and asks for name first', async () => {
    const request = pendingRequest();
    expect(request.request.params.get('sort')).toBe('name');
    request.flush(page([card('Clubkaart', 'Delhaize')]));
    await settle();

    expect(el.querySelector('label[for="card-sort"]')?.textContent).toContain(
      'Sort by',
    );
    expect(sortSelect().value).toBe('name');
    expect(
      Array.from(sortSelect().options, (option) => option.text.trim()),
    ).toEqual(['Name', 'Last used', 'Most used']);
  });

  it('fetches again in the chosen order, keeping the cards on screen meanwhile', async () => {
    await showCards(card('Aldi', 'Aldi'), card('Colruyt', 'Colruyt'));

    await chooseSort('mostUsed');

    const request = pendingRequest();
    expect(request.request.params.get('sort')).toBe('mostUsed');
    expect(names()).toEqual(['Aldi', 'Colruyt']);
    expect(sortSelect().value).toBe('mostUsed');
    expect(el.querySelector('app-loading-indicator')).toBeNull();

    request.flush(page([card('Colruyt', 'Colruyt'), card('Aldi', 'Aldi')]));
    await settle();
    expect(names()).toEqual(['Colruyt', 'Aldi']);
  });

  it('asks for the remembered order', async () => {
    await showCards(card('Aldi', 'Aldi'));
    await chooseSort('lastUsed');
    await showCards(card('Aldi', 'Aldi'));

    // A new visit to the overview, as after 'Back to cards'.
    const again = TestBed.createComponent(CardsPage);
    again.detectChanges();

    expect(pendingRequest().request.params.get('sort')).toBe('lastUsed');
  });

  it('shows the error state when a new order cannot be fetched, and retries in that order', async () => {
    await showCards(card('Aldi', 'Aldi'));
    await chooseSort('lastUsed');

    pendingRequest().flush(...serverError);
    await settle();

    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(el.querySelector('.grid')).toBeNull();

    el.querySelector('button')?.click();
    await settle();
    expect(el.querySelector('app-loading-indicator')?.textContent).toContain(
      'Loading',
    );
    expect(el.querySelector('.grid')).toBeNull();
    expect(pendingRequest().request.params.get('sort')).toBe('lastUsed');
  });

  it('gives each tile a toggle button for its favorite mark, outside the card link', async () => {
    await showCards(favorite('Aldi'), card('Colruyt', 'Colruyt'));

    expect(star('Aldi').getAttribute('aria-pressed')).toBe('true');
    expect(star('Colruyt').getAttribute('aria-pressed')).toBe('false');
    expect(star('Aldi').type).toBe('button');
    expect(el.querySelector('a button')).toBeNull();
  });

  it('marks a card and shows the new order without a loading indicator', async () => {
    await showCards(card('Aldi', 'Aldi'), card('Colruyt', 'Colruyt'));

    star('Colruyt').click();
    expect(await answerFavorite('Colruyt')).toBe('PUT');

    expect(names()).toEqual(['Aldi', 'Colruyt']);
    expect(el.querySelector('app-loading-indicator')).toBeNull();

    await showCards(favorite('Colruyt'), card('Aldi', 'Aldi'));
    expect(names()).toEqual(['Colruyt', 'Aldi']);
    expect(star('Colruyt').getAttribute('aria-pressed')).toBe('true');
  });

  it('removes the mark of a favorite', async () => {
    await showCards(favorite('Colruyt'));

    star('Colruyt').click();
    expect(await answerFavorite('Colruyt')).toBe('DELETE');

    await showCards(card('Colruyt', 'Colruyt'));
    expect(star('Colruyt').getAttribute('aria-pressed')).toBe('false');
  });

  it('fetches again when a favorite changes while a new order is still loading', async () => {
    await showCards(card('Aldi', 'Aldi'));
    await chooseSort('mostUsed');
    const outdated = pendingRequest();

    star('Aldi').click();
    await answerFavorite('Aldi');

    outdated.flush(page([card('Aldi', 'Aldi')]));
    await showCards(favorite('Aldi'));
    expect(star('Aldi').getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the focus on the star of a card that moves', async () => {
    await showCards(card('Aldi', 'Aldi'), card('Colruyt', 'Colruyt'));
    star('Colruyt').focus();
    star('Colruyt').click();
    await answerFavorite('Colruyt');

    // Moving a node drops its focus in a browser; make sure it is lost either way.
    star('Colruyt').blur();
    await showCards(favorite('Colruyt'), card('Aldi', 'Aldi'));

    expect(document.activeElement).toBe(star('Colruyt'));
  });

  it('keeps the focus on a moving star after the order was changed', async () => {
    await showCards(card('Aldi', 'Aldi'), card('Colruyt', 'Colruyt'));
    await chooseSort('mostUsed');
    await showCards(card('Aldi', 'Aldi'), card('Colruyt', 'Colruyt'));
    star('Colruyt').focus();
    star('Colruyt').click();
    await answerFavorite('Colruyt');

    // The old list is still on screen; the focus is only lost when the new one moves the card.
    star('Colruyt').blur();
    await showCards(favorite('Colruyt'), card('Aldi', 'Aldi'));

    expect(document.activeElement).toBe(star('Colruyt'));
  });

  it('does not take the focus from where the user went meanwhile', async () => {
    await showCards(card('Aldi', 'Aldi'), card('Colruyt', 'Colruyt'));
    star('Colruyt').focus();
    star('Colruyt').click();
    await answerFavorite('Colruyt');

    sortSelect().focus();
    await showCards(favorite('Colruyt'), card('Aldi', 'Aldi'));

    expect(document.activeElement).toBe(sortSelect());
  });

  it('keeps the cards and shows a notification when saving a favorite fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await showCards(card('Aldi', 'Aldi'));

    star('Aldi').click();
    favoriteRequest('Aldi').flush(...serverError);
    await settle();

    expect(names()).toEqual(['Aldi']);
    expect(star('Aldi').getAttribute('aria-pressed')).toBe('false');
    expect(TestBed.inject(NotificationService).notifications()).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
    http.verify();
  });

  it('announces a new order and the number of cards once the list is on screen', async () => {
    expect(announcement()).toBe('');
    await showCards(card('Aldi', 'Aldi'), card('Colruyt', 'Colruyt'));
    expect(announcement()).toBe('');
    sortSelect().focus();

    await chooseSort('mostUsed');
    expect(announcement()).toBe('');

    await showCards(card('Colruyt', 'Colruyt'), card('Aldi', 'Aldi'));
    expect(announcement()).toBe('Sorted by most used, 2 cards');
    expect(document.activeElement).toBe(sortSelect());
  });

  it('empties the announcement on every new choice, so each one is heard', async () => {
    await showCards(card('Aldi', 'Aldi'));
    await chooseSort('lastUsed');
    await showCards(card('Aldi', 'Aldi'));
    expect(announcement()).toBe('Sorted by last used, 1 card');

    await chooseSort('name');
    expect(announcement()).toBe('');
    await showCards(card('Aldi', 'Aldi'));
    expect(announcement()).toBe('Sorted by name, 1 card');
  });

  it('does not announce a favorite change', async () => {
    await showCards(card('Aldi', 'Aldi'));

    star('Aldi').click();
    await answerFavorite('Aldi');
    await showCards(favorite('Aldi'));

    expect(announcement()).toBe('');
  });

  it('announces the new order only when a retry succeeds after a failure', async () => {
    await showCards(card('Aldi', 'Aldi'));
    await chooseSort('lastUsed');
    pendingRequest().flush(...serverError);
    await settle();
    expect(announcement()).toBe('');

    el.querySelector('button')?.click();
    await settle();
    await showCards(card('Aldi', 'Aldi'));

    expect(announcement()).toBe('Sorted by last used, 1 card');
  });
});

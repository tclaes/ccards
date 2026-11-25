import { TestBed } from '@angular/core/testing';
import { CardSortPreference } from './card-sort-preference';
import { CARD_SORT_STORAGE_KEY } from './card-sort.model';

describe('CardSortPreference', () => {
  const preference = () => TestBed.inject(CardSortPreference);

  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('sorts by name when nothing is remembered', () => {
    expect(preference().sort()).toBe('name');
  });

  it('starts with the remembered order', () => {
    localStorage.setItem(CARD_SORT_STORAGE_KEY, 'lastUsed');

    expect(preference().sort()).toBe('lastUsed');
  });

  it('remembers the chosen order', () => {
    preference().choose('mostUsed');

    expect(preference().sort()).toBe('mostUsed');
    expect(localStorage.getItem(CARD_SORT_STORAGE_KEY)).toBe('mostUsed');
  });

  it('sorts by name when the remembered value is unknown', () => {
    localStorage.setItem(CARD_SORT_STORAGE_KEY, 'colour');

    expect(preference().sort()).toBe('name');
  });

  it('sorts by name and logs it when storage cannot be read', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });

    expect(preference().sort()).toBe('name');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('keeps the chosen order for this visit when storage cannot be written', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    preference().choose('lastUsed');

    expect(preference().sort()).toBe('lastUsed');
    expect(warn).toHaveBeenCalledOnce();
  });
});

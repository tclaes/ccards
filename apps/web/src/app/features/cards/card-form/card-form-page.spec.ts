import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BarcodeType, provideApi } from '@ccards/api-client';
import type { Card } from '@ccards/api-client';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { NotificationService } from '../../../core/notification/notification.service';
import { CardFormPage } from './card-form-page';

@Component({ template: '' })
class Overview {}

const saved = {
  id: 'c1',
  name: 'Clubkaart',
  store: 'Delhaize',
  cardNumber: 'AB-1',
  barcodeType: BarcodeType.Code128,
  note: 'hello',
  version: 3,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
} as Card;

// jsdom has no modal dialog behaviour, so stub the two methods the dialog uses.
function stubDialog(): void {
  const proto = HTMLDialogElement.prototype;
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto.close = function (this: HTMLDialogElement, value?: string) {
    if (value !== undefined) this.returnValue = value;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

describe('CardFormPage', () => {
  let fixture: ComponentFixture<CardFormPage>;
  let http: HttpTestingController;
  let el: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stubDialog();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'cards', component: Overview }]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        // Same-origin, as in the app.
        provideApi(''),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
  });

  // Not whenStable(): a pending HTTP request keeps the app unstable.
  async function settle(): Promise<void> {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  async function open(id?: string): Promise<void> {
    fixture = TestBed.createComponent(CardFormPage);
    el = fixture.nativeElement as HTMLElement;
    if (id) fixture.componentRef.setInput('id', id);
    await settle();
  }

  async function openEdit(card: Card = saved): Promise<void> {
    await open(card.id);
    http.expectOne(`/api/cards/${card.id}`).flush(card);
    await settle();
  }

  const input = (label: string) =>
    Array.from(el.querySelectorAll('label'))
      .find((l) => l.textContent?.trim().startsWith(label))!
      .querySelector<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >('input, textarea, select')!;

  async function fill(label: string, value: string): Promise<void> {
    const control = input(label);
    control.value = value;
    control.dispatchEvent(new Event('input'));
    control.dispatchEvent(new Event('change'));
    control.dispatchEvent(new Event('blur'));
    await settle();
  }

  async function submit(): Promise<void> {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle();
  }

  const request = (method: string, url = '/api/cards') =>
    http.expectOne((r) => r.method === method && r.url === url);

  async function fillValidCreate(): Promise<void> {
    await fill('Name', 'Clubkaart');
    await fill('Store', 'Delhaize');
    await fill('Card number', 'AB-1234');
  }

  const toasts = () => TestBed.inject(NotificationService).notifications();

  describe('create', () => {
    beforeEach(() => open());

    it('shows required errors and sends nothing for an empty form', async () => {
      await submit();

      expect(el.textContent).toContain('Name is required');
      expect(el.textContent).toContain('Store is required');
      expect(input('Name').getAttribute('aria-invalid')).toBe('true');
      expect(input('Name').getAttribute('aria-describedby')).toBe(
        'name-errors',
      );
      http.expectNone('/api/cards');
    });

    it('starts without error marks on untouched fields', () => {
      expect(input('Name').hasAttribute('aria-invalid')).toBe(false);
      expect(input('Name').hasAttribute('aria-describedby')).toBe(false);
    });

    it('shows an error for a name that is too long', async () => {
      await fill('Name', 'x'.repeat(101));
      expect(el.textContent).toContain('Name can have at most 100 characters');
    });

    it('rejects a wrong check digit and re-checks when the type changes', async () => {
      await fill('Card number', '4006381333932');
      expect(el.textContent).not.toContain('check digit');

      await fill('Barcode type', BarcodeType.Ean13);
      expect(el.textContent).toContain('13 digits with a valid check digit');

      await fill('Card number', '4006381333931');
      expect(el.textContent).not.toContain('check digit');
    });

    it('creates the card without empty optional fields, then goes to the overview', async () => {
      await fillValidCreate();
      await submit();

      const req = request('POST');
      expect(req.request.body).toEqual({
        name: 'Clubkaart',
        store: 'Delhaize',
        cardNumber: 'AB-1234',
        barcodeType: BarcodeType.Code128,
      });
      req.flush(
        { ...saved, id: 'new' },
        { status: 201, statusText: 'Created' },
      );
      await settle();

      expect(navigate).toHaveBeenCalledWith(['/cards']);
      expect(toasts().map((n) => n.severity)).toEqual(['success']);
    });

    it('sends only one request for a double submit', async () => {
      await fillValidCreate();
      await submit();
      await submit();

      request('POST').flush(saved, { status: 201, statusText: 'Created' });
    });

    it('shows a server error at its field, keeps the values, and clears it on edit', async () => {
      await fillValidCreate();
      await submit();
      request('POST').flush(
        {
          title: 'Bad request',
          status: 400,
          errors: [{ field: 'cardNumber', message: 'already registered' }],
        },
        { status: 400, statusText: 'Bad Request' },
      );
      await settle();

      expect(el.textContent).toContain('already registered');
      expect(input('Card number').getAttribute('aria-invalid')).toBe('true');
      expect(input('Name').value).toBe('Clubkaart');
      expect(toasts()).toEqual([]);

      await fill('Card number', 'AB-12345');
      expect(el.textContent).not.toContain('already registered');
    });

    it('shows an error for a field that is not on the form in the general area', async () => {
      await fillValidCreate();
      await submit();
      request('POST').flush(
        {
          title: 'Bad request',
          status: 400,
          errors: [{ field: 'ownerId', message: 'is unknown' }],
        },
        { status: 400, statusText: 'Bad Request' },
      );
      await settle();

      expect(el.querySelector('[role="alert"]')?.textContent).toContain(
        'ownerId: is unknown',
      );
      expect(toasts()).toEqual([]);
    });

    it('shows the global notification for a server failure and keeps the values', async () => {
      await fillValidCreate();
      await submit();
      request('POST').flush(
        { title: 'Server error', status: 500 },
        { status: 500, statusText: 'Server Error' },
      );
      await settle();

      expect(toasts()).toHaveLength(1);
      expect(toasts()[0].severity).toBe('error');
      expect(input('Name').value).toBe('Clubkaart');
    });

    it('has no delete action', () => {
      expect(el.textContent).not.toContain('Delete');
    });
  });

  describe('edit', () => {
    it('pre-fills the form from the card', async () => {
      await openEdit();

      expect(input('Name').value).toBe('Clubkaart');
      expect(input('Store').value).toBe('Delhaize');
      expect(input('Card number').value).toBe('AB-1');
      expect(input('Barcode type').value).toBe(BarcodeType.Code128);
      expect(input('Colour').value).toBe('');
      expect(input('Note').value).toBe('hello');
    });

    it('sends only the changed field and the version as merge-patch', async () => {
      await openEdit();
      await fill('Name', 'Bonus');
      await submit();

      const req = request('PATCH', '/api/cards/c1');
      expect(req.request.headers.get('Content-Type')).toBe(
        'application/merge-patch+json',
      );
      expect(req.request.body).toEqual({ name: 'Bonus', version: 3 });
      req.flush({ ...saved, name: 'Bonus', version: 4 });
      await settle();
      expect(navigate).toHaveBeenCalledWith(['/cards']);
    });

    it('sets a cleared optional field to null', async () => {
      await openEdit();
      await fill('Note', '');
      await submit();

      const req = request('PATCH', '/api/cards/c1');
      expect(req.request.body).toEqual({ note: null, version: 3 });
      req.flush({ ...saved, note: undefined, version: 4 });
    });

    it('sends nothing when nothing changed', async () => {
      await openEdit();
      await submit();

      http.expectNone('/api/cards/c1');
      expect(navigate).toHaveBeenCalledWith(['/cards']);
    });

    it('shows a not-found state with a link back for an unknown card', async () => {
      await open('missing');
      http
        .expectOne('/api/cards/missing')
        .flush(
          { title: 'Not found', status: 404 },
          { status: 404, statusText: 'Not Found' },
        );
      await settle();

      expect(el.textContent).toContain('does not exist');
      expect(el.querySelector('a[href="/cards"]')).not.toBeNull();
      expect(el.querySelector('form')).toBeNull();
      expect(toasts()).toEqual([]);
    });

    it('explains a conflict, keeps the entered values and reloads on request', async () => {
      await openEdit();
      await fill('Name', 'Mine');
      await submit();
      request('PATCH', '/api/cards/c1').flush(
        { title: 'Conflict', status: 409 },
        { status: 409, statusText: 'Conflict' },
      );
      await settle();

      expect(el.querySelector('[role="alert"]')?.textContent).toContain(
        'changed elsewhere',
      );
      expect(input('Name').value).toBe('Mine');
      expect(toasts()).toEqual([]);

      Array.from(el.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Reload'))!
        .click();
      await settle();
      http
        .expectOne('/api/cards/c1')
        .flush({ ...saved, name: 'Theirs', version: 4 });
      await settle();

      expect(input('Name').value).toBe('Theirs');
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    describe('delete', () => {
      const dialog = () => el.querySelector('dialog')!;
      const deleteButton = () =>
        Array.from(
          el.querySelectorAll<HTMLButtonElement>('.actions button'),
        ).find((b) => b.textContent?.includes('Delete'))!;

      beforeEach(async () => {
        await openEdit();
        deleteButton().click();
        await settle();
      });

      it('asks first, naming the card', () => {
        expect(dialog().open).toBe(true);
        expect(dialog().textContent).toContain('Delete Clubkaart?');
        expect(dialog().textContent).toContain('cannot be undone');
        http.expectNone('/api/cards/c1');
      });

      it('deletes after confirming and returns to the overview', async () => {
        dialog().close('confirm');
        await settle();

        request('DELETE', '/api/cards/c1').flush(null, {
          status: 204,
          statusText: 'No Content',
        });
        await settle();
        expect(navigate).toHaveBeenCalledWith(['/cards']);
      });

      it('sends nothing when cancelled', async () => {
        dialog().close('cancel');
        await settle();

        http.expectNone('/api/cards/c1');
        expect(dialog().open).toBe(false);
        expect(input('Name').value).toBe('Clubkaart');
      });

      it('stays on the page with a notification when deleting fails', async () => {
        dialog().close('confirm');
        await settle();
        request('DELETE', '/api/cards/c1').flush(
          { title: 'Server error', status: 500 },
          { status: 500, statusText: 'Server Error' },
        );
        await settle();

        expect(navigate).not.toHaveBeenCalled();
        expect(toasts()).toHaveLength(1);
      });
    });
  });
});

import {
  HttpClient,
  HttpContext,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../notification/notification.service';
import { SKIP_ERROR_NOTIFICATION, errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let notifications: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    notifications = TestBed.inject(NotificationService);
  });

  const shown = () => notifications.notifications().map((n) => n.message);

  function fail(
    body: string | object,
    status: number,
    context?: HttpContext,
  ): { error: unknown } {
    const result: { error: unknown } = { error: undefined };
    http.get('/api/x', { context }).subscribe({
      error: (e) => (result.error = e),
    });
    controller
      .expectOne('/api/x')
      .flush(body, { status, statusText: 'Whatever' });
    return result;
  }

  it('shows the problem detail', () => {
    fail({ title: 'Not Found', status: 404, detail: 'Card 7 not found' }, 404);
    expect(shown()).toEqual(['Card 7 not found']);
  });

  it('falls back to the title without a detail', () => {
    fail({ title: 'Conflict', status: 409 }, 409);
    expect(shown()).toEqual(['Conflict']);
  });

  it('lists field names and messages of a validation problem', () => {
    fail(
      {
        title: 'Bad Request',
        status: 400,
        detail: 'Request validation failed.',
        errors: [
          { field: 'title', message: 'must not be blank' },
          { field: 'count', message: 'must be at least 1' },
        ],
      },
      400,
    );
    expect(shown()).toEqual([
      'Request validation failed.\ntitle: must not be blank\ncount: must be at least 1',
    ]);
  });

  it('says the server cannot be reached on a network error', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    controller.expectOne('/api/x').error(new ProgressEvent('error'));
    expect(shown()).toHaveLength(1);
    expect(shown()[0]).toMatch(/cannot reach the server/i);
  });

  it('shows a generic message instead of raw HTML', () => {
    fail('<html><body>Bad gateway</body></html>', 502);
    expect(shown()).toHaveLength(1);
    expect(shown()[0]).not.toContain('<');
    expect(shown()[0]).toContain('502');
  });

  it('still propagates the error to the caller', () => {
    const result = fail({ title: 'Oops', status: 500 }, 500);
    expect(result.error).toBeDefined();
  });

  it('shows nothing when the caller opts out', () => {
    const result = fail(
      { title: 'Oops', status: 500 },
      500,
      new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
    );
    expect(shown()).toEqual([]);
    expect(result.error).toBeDefined();
  });
});

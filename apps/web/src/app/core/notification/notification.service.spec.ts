import { TestBed } from '@angular/core/testing';
import { MAX_NOTIFICATIONS, NotificationService } from './notification.service';
import { NOTIFICATION_DURATION_MS } from './notification.tokens';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [{ provide: NOTIFICATION_DURATION_MS, useValue: 1000 }],
    });
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => vi.useRealTimers());

  const messages = () => service.notifications().map((n) => n.message);

  it('adds an error notification', () => {
    service.error('Boom');
    expect(messages()).toEqual(['Boom']);
    expect(service.notifications()[0].severity).toBe('error');
  });

  it('dismisses a notification and clears its timer', () => {
    service.error('a');
    const [{ id }] = service.notifications();
    service.dismiss(id);
    expect(messages()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps at most the maximum, dropping the oldest', () => {
    for (let i = 1; i <= MAX_NOTIFICATIONS + 1; i++) service.error(`m${i}`);
    expect(messages()).toEqual(['m2', 'm3', 'm4']);
    expect(vi.getTimerCount()).toBe(MAX_NOTIFICATIONS);
  });

  it('auto-dismisses after the configured time', () => {
    service.error('a');
    vi.advanceTimersByTime(999);
    expect(messages()).toEqual(['a']);
    vi.advanceTimersByTime(1);
    expect(messages()).toEqual([]);
  });

  it('does not auto-dismiss while paused and restarts the full time on resume', () => {
    service.error('a');
    const [{ id }] = service.notifications();
    vi.advanceTimersByTime(900);
    service.pause(id);
    vi.advanceTimersByTime(5000);
    expect(messages()).toEqual(['a']);

    service.resume(id);
    vi.advanceTimersByTime(999);
    expect(messages()).toEqual(['a']);
    vi.advanceTimersByTime(1);
    expect(messages()).toEqual([]);
  });
});

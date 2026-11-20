import type { Mock } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationHost } from './notification-host';
import { NotificationService } from './notification.service';
import { NOTIFICATION_DURATION_MS } from './notification.tokens';

describe('NotificationHost', () => {
  let fixture: ComponentFixture<NotificationHost>;
  let service: NotificationService;
  let el: HTMLElement;
  let showPopover: Mock<() => void>;
  let hidePopover: Mock<() => void>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationHost],
      providers: [{ provide: NOTIFICATION_DURATION_MS, useValue: 1000 }],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationHost);
    service = TestBed.inject(NotificationService);
    el = fixture.nativeElement as HTMLElement;
    // The test DOM may not implement the Popover API; observe the calls instead.
    showPopover = vi.fn<() => void>();
    hidePopover = vi.fn<() => void>();
    el.showPopover = showPopover;
    el.hidePopover = hidePopover;
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  const alerts = () => el.querySelectorAll('[role="alert"]');

  it('is a labelled region and a manual popover', () => {
    fixture.detectChanges();
    expect(el.getAttribute('popover')).toBe('manual');
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-label')).toBe('Notifications');
  });

  it('renders each notification in an alert region', () => {
    service.error('Boom');
    fixture.detectChanges();
    expect(alerts()).toHaveLength(1);
    expect(alerts()[0].textContent).toContain('Boom');
  });

  it('opens the popover with the first notification and closes it when empty', () => {
    service.error('Boom');
    fixture.detectChanges();
    expect(showPopover).toHaveBeenCalledOnce();

    service.error('Again');
    fixture.detectChanges();
    expect(showPopover).toHaveBeenCalledOnce();

    service.notifications().forEach((n) => service.dismiss(n.id));
    fixture.detectChanges();
    expect(hidePopover).toHaveBeenCalled();
  });

  it('removes a notification when dismissed', () => {
    service.error('Boom');
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>(
      'button[aria-label="Dismiss notification"]',
    )!.click();
    fixture.detectChanges();
    expect(alerts()).toHaveLength(0);
  });

  it('pauses auto-dismiss on hover and resumes on leave', () => {
    service.error('Boom');
    fixture.detectChanges();
    const alert = alerts()[0];

    alert.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(alerts()).toHaveLength(1);

    alert.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(alerts()).toHaveLength(0);
  });

  it('pauses while focus is inside', () => {
    service.error('Boom');
    fixture.detectChanges();
    alerts()[0].dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(alerts()).toHaveLength(1);
  });
});

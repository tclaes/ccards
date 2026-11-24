import { Service, inject, signal } from '@angular/core';
import type { Notification } from './notification.model';
import { NOTIFICATION_DURATION_MS } from './notification.tokens';

/** More notifications than this push the oldest ones out. */
export const MAX_NOTIFICATIONS = 3;

/** Central place where the app shows messages to the user. */
@Service()
export class NotificationService {
  private readonly duration = inject(NOTIFICATION_DURATION_MS);
  private readonly items = signal<readonly Notification[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 1;

  readonly notifications = this.items.asReadonly();

  error(message: string): void {
    this.add(message, 'error');
  }

  success(message: string): void {
    this.add(message, 'success');
  }

  private add(message: string, severity: Notification['severity']): void {
    const notification: Notification = {
      id: this.nextId++,
      message,
      severity,
    };
    const kept = [...this.items(), notification].slice(-MAX_NOTIFICATIONS);
    this.items()
      .filter((n) => !kept.includes(n))
      .forEach((n) => this.clearTimer(n.id));
    this.items.set(kept);
    this.startTimer(notification.id);
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.items.update((all) => all.filter((n) => n.id !== id));
  }

  /** Stops the auto-dismiss countdown (hover or keyboard focus). */
  pause(id: number): void {
    this.clearTimer(id);
  }

  /** Restarts the full countdown once hover and focus have left. */
  resume(id: number): void {
    if (this.items().some((n) => n.id === id)) {
      this.startTimer(id);
    }
  }

  private startTimer(id: number): void {
    this.clearTimer(id);
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), this.duration),
    );
  }

  private clearTimer(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
  }
}

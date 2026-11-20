import { Component, ElementRef, computed, effect, inject } from '@angular/core';
import { Toast } from '../../ui';
import { NotificationService } from './notification.service';

/**
 * Smart component: reads the NotificationService and renders one dumb Toast per
 * message. It is a manual popover, so it sits in the top layer above all page
 * content (no z-index) while at least one notification exists.
 */
@Component({
  selector: 'app-notification-host',
  imports: [Toast],
  template: `
    @for (n of service.notifications(); track n.id) {
      <app-toast
        [message]="n.message"
        (dismissed)="service.dismiss(n.id)"
        (paused)="service.pause(n.id)"
        (resumed)="service.resume(n.id)"
      />
    }
  `,
  styleUrl: './notification-host.css',
  host: {
    popover: 'manual',
    role: 'region',
    'aria-label': 'Notifications',
  },
})
export class NotificationHost {
  protected readonly service = inject(NotificationService);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly hasNotifications = computed(
    () => this.service.notifications().length > 0,
  );

  constructor() {
    effect(() => {
      // Optional calls: browsers without the Popover API just show the host.
      if (this.hasNotifications()) {
        this.element.showPopover?.();
      } else {
        this.element.hidePopover?.();
      }
    });
  }
}

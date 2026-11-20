import { InjectionToken } from '@angular/core';

/** How long a notification stays before it removes itself. */
export const NOTIFICATION_DURATION_MS = new InjectionToken<number>(
  'NOTIFICATION_DURATION_MS',
  { providedIn: 'root', factory: () => 8000 },
);

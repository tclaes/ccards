import { DestroyRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

function releaseFailed(error: unknown): void {
  console.warn('Could not release the screen wake lock', error);
}

/**
 * Keeps the screen on until the calling component or service is destroyed. Call it in an
 * injection context. The browser drops the lock when the tab is hidden, so it asks again
 * when the tab becomes visible. Where the API is missing or refused, nothing happens: the
 * page works the same, the screen may just dim.
 */
export function keepScreenAwake(): void {
  const doc = inject(DOCUMENT);
  const wakeLock = doc.defaultView?.navigator.wakeLock;
  if (!wakeLock) return;

  let sentinel: WakeLockSentinel | undefined;
  let requesting = false;
  let destroyed = false;

  const acquire = async () => {
    if (requesting || (sentinel && !sentinel.released)) return;
    requesting = true;
    try {
      const acquired = await wakeLock.request('screen');
      if (destroyed) {
        await acquired.release();
      } else {
        sentinel = acquired;
      }
    } catch (error) {
      // Refused (battery saver, permissions policy): the page works without it.
      console.warn('Could not keep the screen on', error);
    } finally {
      requesting = false;
    }
  };
  const onVisibilityChange = () => {
    if (doc.visibilityState === 'visible') void acquire();
  };

  doc.addEventListener('visibilitychange', onVisibilityChange);
  inject(DestroyRef).onDestroy(() => {
    destroyed = true;
    doc.removeEventListener('visibilitychange', onVisibilityChange);
    sentinel?.release().catch(releaseFailed);
  });
  void acquire();
}

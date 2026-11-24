import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { keepScreenAwake } from './wake-lock';

class FakeSentinel {
  released = false;
  release = vi.fn(async () => {
    this.released = true;
  });
}

@Component({ selector: 'app-host', template: '' })
class Host {
  constructor() {
    keepScreenAwake();
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('keepScreenAwake', () => {
  afterEach(() => Reflect.deleteProperty(navigator, 'wakeLock'));

  function create(wakeLock?: { request: ReturnType<typeof vi.fn> }) {
    // Installs (or removes) `navigator.wakeLock` on the real test document.
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: wakeLock,
    });
    return TestBed.createComponent(Host);
  }

  it('holds a screen wake lock while the component lives', async () => {
    const request = vi.fn(async () => new FakeSentinel());
    create({ request });
    await flush();
    expect(request).toHaveBeenCalledExactlyOnceWith('screen');
  });

  it('releases the lock when the component is destroyed', async () => {
    const sentinel = new FakeSentinel();
    const fixture = create({ request: vi.fn(async () => sentinel) });
    await flush();
    fixture.destroy();
    expect(sentinel.release).toHaveBeenCalled();
  });

  it('releases a lock that arrives after the component was destroyed', async () => {
    const sentinel = new FakeSentinel();
    const fixture = create({ request: vi.fn(async () => sentinel) });
    fixture.destroy();
    await flush();
    expect(sentinel.release).toHaveBeenCalled();
  });

  it('asks again when the tab becomes visible after the browser dropped the lock', async () => {
    const first = new FakeSentinel();
    const request = vi
      .fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(new FakeSentinel());
    create({ request });
    await flush();
    first.released = true; // what the browser does when the tab is hidden
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not ask again while the lock is still held', async () => {
    const request = vi.fn(async () => new FakeSentinel());
    create({ request });
    await flush();
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('does not ask twice while the first request is still pending', async () => {
    const request = vi.fn(() => new Promise(() => undefined));
    create({ request });
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('does nothing and does not fail when the API is missing', () => {
    expect(() => create()).not.toThrow();
  });

  it('carries on when the request is refused', async () => {
    const request = vi.fn(async () => {
      throw new DOMException('denied', 'NotAllowedError');
    });
    const fixture = create({ request });
    await flush();
    expect(() => fixture.destroy()).not.toThrow();
  });
});

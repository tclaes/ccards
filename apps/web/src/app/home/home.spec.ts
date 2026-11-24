import { TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  it('renders a Web Awesome badge as an upgraded custom element', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    const badge: HTMLElement = fixture.nativeElement.querySelector('wa-badge');
    await customElements.whenDefined('wa-badge');

    expect(badge.textContent).toContain('Preview');
    expect(badge.shadowRoot).not.toBeNull();
  });
});

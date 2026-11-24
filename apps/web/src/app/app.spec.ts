import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { appRoutes } from './app.routes';

describe('App shell', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
  });

  async function navigateTo(url: string): Promise<HTMLElement> {
    await router.navigateByUrl(url);
    // Not whenStable(): the page's pending HTTP request keeps the app unstable.
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the card overview on the root route', async () => {
    const shell = await navigateTo('/');
    expect(router.url).toBe('/cards');
    expect(shell.querySelector('app-cards-page')).not.toBeNull();
  });

  it('redirects unknown routes to the card overview', async () => {
    const shell = await navigateTo('/does-not-exist');
    expect(router.url).toBe('/cards');
    expect(shell.querySelector('app-cards-page')).not.toBeNull();
  });
});

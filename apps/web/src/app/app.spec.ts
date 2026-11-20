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
      providers: [provideRouter(appRoutes)],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
  });

  async function navigateTo(url: string): Promise<HTMLElement> {
    await router.navigateByUrl(url);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the placeholder page in the shell on the root route', async () => {
    const shell = await navigateTo('/');
    expect(shell.querySelector('h1')?.textContent).toBe('ccards-BROKEN');
  });

  it('redirects unknown routes to the root', async () => {
    const shell = await navigateTo('/does-not-exist');
    expect(router.url).toBe('/');
    expect(shell.querySelector('h1')?.textContent).toBe('ccards-BROKEN');
  });
});

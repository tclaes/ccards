import { HttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';
import { NotificationService } from './core/notification/notification.service';

describe('appConfig', () => {
  it('shows a notification when an HTTP call fails', () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    TestBed.inject(HttpClient)
      .get('/api/cards')
      .subscribe({ error: () => undefined });
    TestBed.inject(HttpTestingController)
      .expectOne('/api/cards')
      .flush(
        { title: 'Not Found', status: 404, detail: 'No such card' },
        { status: 404, statusText: 'Not Found' },
      );

    expect(
      TestBed.inject(NotificationService)
        .notifications()
        .map((n) => n.message),
    ).toEqual(['No such card']);
  });
});

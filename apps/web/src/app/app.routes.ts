import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'cards' },
  {
    path: 'cards',
    loadComponent: () =>
      import('./features/cards/cards-page/cards-page').then((m) => m.CardsPage),
  },
  { path: '**', redirectTo: 'cards' },
];

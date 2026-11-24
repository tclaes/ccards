import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'cards' },
  {
    path: 'cards/new',
    loadComponent: () =>
      import('./features/cards/card-form/card-form-page').then(
        (m) => m.CardFormPage,
      ),
  },
  {
    path: 'cards/:id/edit',
    loadComponent: () =>
      import('./features/cards/card-form/card-form-page').then(
        (m) => m.CardFormPage,
      ),
  },
  {
    path: 'cards/:id',
    loadComponent: () =>
      import('./features/cards/checkout/checkout-page').then(
        (m) => m.CheckoutPage,
      ),
  },
  {
    path: 'cards',
    loadComponent: () =>
      import('./features/cards/cards-page/cards-page').then((m) => m.CardsPage),
  },
  { path: '**', redirectTo: 'cards' },
];

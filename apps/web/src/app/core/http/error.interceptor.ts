import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import type { Problem, ValidationProblem } from '@ccards/api-client';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notification/notification.service';

/**
 * Set to `true` on a request whose caller shows its own error (for example a
 * form rendering field errors), so no notification is raised for it.
 */
export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(
  () => false,
);

/** Shows every failed HTTP call via the NotificationService, then rethrows. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        !req.context.get(SKIP_ERROR_NOTIFICATION)
      ) {
        notifications.error(messageFor(error));
      }
      return throwError(() => error);
    }),
  );
};

function messageFor(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  if (isProblem(error.error)) {
    const problem = error.error;
    const headline = problem.detail ?? problem.title;
    const fields = isValidationProblem(problem)
      ? problem.errors.map((e) => `${e.field}: ${e.message}`)
      : [];
    return [headline, ...fields].join('\n');
  }
  return error.status >= 500
    ? `The server had a problem (HTTP ${error.status}). Please try again later.`
    : `The request could not be completed (HTTP ${error.status}).`;
}

function isProblem(body: unknown): body is Problem {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as Problem).title === 'string' &&
    typeof (body as Problem).status === 'number'
  );
}

function isValidationProblem(problem: Problem): problem is ValidationProblem {
  return Array.isArray((problem as ValidationProblem).errors);
}

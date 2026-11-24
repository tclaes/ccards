import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Says that something does not exist and links to somewhere that does. Dumb: plain inputs. */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <p>{{ message() }}</p>
    <a [routerLink]="linkTo()">{{ linkLabel() }}</a>
  `,
  host: { role: 'alert' },
})
export class NotFound {
  readonly message = input.required<string>();
  readonly linkLabel = input.required<string>();
  /** Router path of the link, for example `/cards`. */
  readonly linkTo = input.required<string>();
}

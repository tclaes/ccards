import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import '@awesome.me/webawesome/dist/components/badge/badge.js';

@Component({
  selector: 'app-home',
  template: `<h1>ccards</h1>
    <wa-badge>Preview</wa-badge>`,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Home {}

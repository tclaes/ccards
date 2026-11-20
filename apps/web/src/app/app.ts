import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationHost } from './core/notification/notification-host';

@Component({
  imports: [RouterOutlet, NotificationHost],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}

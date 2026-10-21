import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';
import { Toolbar } from './layout/toolbar';

@Component({
  imports: [RouterOutlet, Toolbar],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  constructor() {
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
  }
}

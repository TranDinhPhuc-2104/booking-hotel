import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="center" style="flex-direction: column; align-items: flex-start; gap: 12px">
      <p class="eyebrow">404</p>
      <h1 class="title">This page doesn't exist.</h1>
      <a class="back" routerLink="/">← Back to hotels</a>
    </div>
  `,
})
export class NotFound {}

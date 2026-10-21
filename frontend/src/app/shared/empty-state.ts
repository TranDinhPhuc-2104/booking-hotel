import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `<div class="empty">{{ message() }}</div>`,
})
export class EmptyState {
  readonly message = input.required<string>();
}

import { Component, input } from '@angular/core';

@Component({
  selector: 'app-status',
  template: `<span class="status" [attr.data-s]="value().toLowerCase()">{{ value() }}</span>`,
})
export class StatusBadge {
  readonly value = input.required<string>();
}

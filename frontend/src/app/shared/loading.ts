import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  imports: [MatProgressSpinnerModule],
  template: `<div class="center"><mat-spinner diameter="28" strokeWidth="3" /></div>`,
})
export class Loading {}

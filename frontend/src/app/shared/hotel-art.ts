import { Component, computed, input } from '@angular/core';
import { Hotel } from '../core/models/models';

// Soft two-tone backgrounds for hotels without a photo; picked by id so a hotel always looks the same.
export const TONES: [string, string][] = [
  ['#efe9df', '#e0d5c3'], // sand
  ['#e6ece3', '#d0dbc9'], // sage
  ['#e5eaf0', '#cfd9e5'], // mist
  ['#f0e4dd', '#e2cbbf'], // clay
  ['#ebe7f1', '#d8d0e6'], // lilac
];

/** CSS custom properties for a two-tone background, stable for a given number. */
export function toneStyle(n: number): string {
  const [a, b] = TONES[Math.abs(n) % TONES.length];
  return `--a: ${a}; --b: ${b}`;
}

@Component({
  selector: 'app-hotel-art',
  template: `
    <div class="art" [class.banner]="banner()" [style]="tone()">
      @if (hotel().imageUrl) {
        <img [src]="hotel().imageUrl" [alt]="hotel().name" loading="lazy" />
      } @else {
        <span class="art-initial" aria-hidden="true">{{ hotel().name.charAt(0) }}</span>
      }
      <span class="art-tag">{{ hotel().city }}</span>
    </div>
  `,
})
export class HotelArt {
  readonly hotel = input.required<Pick<Hotel, 'id' | 'name' | 'city' | 'imageUrl'>>();
  readonly banner = input(false);
  protected readonly tone = computed(() => toneStyle(this.hotel().id));
}

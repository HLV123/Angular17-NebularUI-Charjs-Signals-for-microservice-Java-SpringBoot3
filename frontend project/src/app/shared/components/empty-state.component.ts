import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="empty">
      <i class="fas {{ icon }}"></i>
      <h4>{{ title }}</h4>
      <p>{{ message }}</p>
    </div>
  `,
    styles: [`
    .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem; text-align:center; }
    i { font-size:3rem; color:#C5CEE0; margin-bottom:1rem; }
    h4 { font-size:1rem; color:#1A2138; margin-bottom:.4rem; }
    p { color:#8F9BB3; font-size:.85rem; max-width:320px; }
  `]
})
export class EmptyStateComponent {
    @Input() icon = 'fa-inbox';
    @Input() title = 'Không có dữ liệu';
    @Input() message = 'Chưa có dữ liệu để hiển thị.';
}

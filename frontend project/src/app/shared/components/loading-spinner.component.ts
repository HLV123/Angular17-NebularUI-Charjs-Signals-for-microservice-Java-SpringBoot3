import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (loading) {
      <div class="loading-wrap">
        <div class="spinner"></div>
        @if (message) { <p>{{ message }}</p> }
      </div>
    }
  `,
    styles: [`
    .loading-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem; }
    .spinner { width:36px; height:36px; border:3px solid #EDF1F7; border-top-color:#3366FF; border-radius:50%; animation:spin .7s linear infinite; }
    p { margin-top:.8rem; color:#8F9BB3; font-size:.85rem; }
    @keyframes spin { to{transform:rotate(360deg)} }
  `]
})
export class LoadingSpinnerComponent {
    @Input() loading = false;
    @Input() message = '';
}

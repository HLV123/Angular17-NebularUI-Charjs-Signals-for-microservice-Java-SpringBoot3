import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (visible) {
      <div class="modal-overlay" (click)="onCancel()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-icon"><i class="fas" [ngClass]="iconClass"></i></div>
          <h3>{{ title }}</h3>
          <p>{{ message }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="onCancel()">Hủy</button>
            <button class="btn-confirm" [ngClass]="confirmClass" (click)="onConfirm()">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    }
  `,
    styles: [`
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:1000; animation:fadeIn .2s ease; }
    .modal-box { background:#fff; border-radius:1.2rem; padding:2rem; width:400px; max-width:90vw; text-align:center; animation:slideUp .25s ease; }
    .modal-icon { font-size:2.5rem; margin-bottom:.8rem; }
    .modal-icon .fa-trash-alt { color:#FF3D71; }
    .modal-icon .fa-exclamation-triangle { color:#FFAA00; }
    .modal-icon .fa-check-circle { color:#00D68F; }
    h3 { font-size:1.1rem; margin-bottom:.5rem; }
    p { color:#8F9BB3; font-size:.9rem; margin-bottom:1.5rem; }
    .modal-actions { display:flex; gap:.8rem; justify-content:center; }
    button { padding:.55rem 1.5rem; border-radius:.6rem; border:none; font-weight:600; font-size:.85rem; cursor:pointer; transition:all .2s; }
    .btn-cancel { background:#F4F6FA; color:#1A2138; }
    .btn-cancel:hover { background:#E4E9F2; }
    .btn-confirm { color:#fff; }
    .btn-confirm.danger { background:#FF3D71; }
    .btn-confirm.danger:hover { background:#DB2C66; }
    .btn-confirm.primary { background:#3366FF; }
    .btn-confirm.primary:hover { background:#274BDB; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  `]
})
export class ConfirmDialogComponent {
    @Input() visible = false;
    @Input() title = 'Xác nhận';
    @Input() message = 'Bạn có chắc chắn?';
    @Input() confirmText = 'Xác nhận';
    @Input() type: 'danger' | 'primary' = 'danger';
    @Output() confirmed = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    get iconClass() {
        return this.type === 'danger' ? 'fa-trash-alt' : 'fa-check-circle';
    }
    get confirmClass() { return this.type; }

    onConfirm() { this.confirmed.emit(); }
    onCancel() { this.cancelled.emit(); }
}

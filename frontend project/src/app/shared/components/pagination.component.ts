import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="pagination">
      <span class="pg-info">Hiển thị {{ startItem }}–{{ endItem }} / {{ totalItems }} mục</span>
      <div class="pg-btns">
        <button [disabled]="currentPage === 1" (click)="goTo(1)" title="Trang đầu"><i class="fas fa-angle-double-left"></i></button>
        <button [disabled]="currentPage === 1" (click)="goTo(currentPage - 1)" title="Trước"><i class="fas fa-angle-left"></i></button>
        @for (p of visiblePages; track p) {
          <button [class.active]="p === currentPage" (click)="goTo(p)">{{ p }}</button>
        }
        <button [disabled]="currentPage === totalPages" (click)="goTo(currentPage + 1)" title="Sau"><i class="fas fa-angle-right"></i></button>
        <button [disabled]="currentPage === totalPages" (click)="goTo(totalPages)" title="Trang cuối"><i class="fas fa-angle-double-right"></i></button>
      </div>
    </div>
  `,
    styles: [`
    .pagination { display:flex; justify-content:space-between; align-items:center; padding:.8rem 1.2rem; border-top:1px solid #EDF1F7; font-size:.82rem; }
    .pg-info { color:#8F9BB3; }
    .pg-btns { display:flex; gap:.3rem; }
    button { width:32px; height:32px; border:1px solid #EDF1F7; background:#fff; border-radius:.5rem; cursor:pointer; font-size:.8rem; display:flex; align-items:center; justify-content:center; transition:all .15s; }
    button:hover:not(:disabled) { background:#F0F3FF; border-color:#3366FF; color:#3366FF; }
    button.active { background:#3366FF; color:#fff; border-color:#3366FF; }
    button:disabled { opacity:.4; cursor:default; }
  `]
})
export class PaginationComponent {
    @Input() totalItems = 0;
    @Input() pageSize = 10;
    @Input() currentPage = 1;
    @Output() pageChange = new EventEmitter<number>();

    get totalPages() { return Math.max(1, Math.ceil(this.totalItems / this.pageSize)); }
    get startItem() { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
    get endItem() { return Math.min(this.currentPage * this.pageSize, this.totalItems); }

    get visiblePages(): number[] {
        const pages: number[] = [];
        const start = Math.max(1, this.currentPage - 2);
        const end = Math.min(this.totalPages, start + 4);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }

    goTo(page: number) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.pageChange.emit(page);
        }
    }
}

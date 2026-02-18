import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { VndCurrencyPipe } from '../../shared/pipes/vnd-currency.pipe';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-inventory', standalone: true,
  imports: [CommonModule, FormsModule, VndCurrencyPipe, PaginationComponent, ConfirmDialogComponent],
  templateUrl: './inventory.component.html', styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent {
  activeTab = signal<'stock' | 'purchase' | 'transfer' | 'supplier'>('stock');
  warehouseFilter = signal('');
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;
  showSupplierForm = signal(false);
  showDeleteConfirm = signal(false);
  deleteTargetId = signal(0);
  newSupplier = { name: '', contactPerson: '', phone: '', email: '', address: '' };

  constructor(public inv: InventoryService) { }

  filteredStock = computed(() => {
    let list = this.inv.getStockItems();
    if (this.warehouseFilter()) list = list.filter(s => s.warehouseName === this.warehouseFilter());
    const s = this.searchTerm().toLowerCase();
    if (s) list = list.filter(i => i.productName.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s));
    return list;
  });
  paginatedStock = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredStock().slice(start, start + this.pageSize);
  });
  kpis = computed(() => {
    const wh = this.inv.getWarehouses();
    const stock = this.inv.getStockItems();
    return {
      warehouses: wh.filter(w => w.type === 'physical').length,
      totalProducts: wh.reduce((s, w) => s + w.totalProducts, 0),
      lowStock: this.inv.getLowStockItems().length,
      outOfStock: this.inv.getOutOfStockItems().length,
    };
  });
  getStockClass(item: any) { return item.quantity === 0 ? 'flash' : item.quantity <= item.minThreshold ? 'wait' : 'ok'; }
  getStockLabel(item: any) { return item.quantity === 0 ? 'Hết hàng' : item.quantity <= item.minThreshold ? 'Sắp hết' : 'Đủ hàng'; }
  getTransferStatusClass(s: string) { const m: any = { draft: 'wait', approved: 'info', in_transit: 'ship', received: 'done' }; return m[s] || 'info'; }
  getTransferStatusLabel(s: string) { const m: any = { draft: 'Nháp', approved: 'Đã duyệt', in_transit: 'Đang vận chuyển', received: 'Đã nhận' }; return m[s] || s; }
  getPOStatusClass(s: string) { const m: any = { draft: 'wait', approved: 'ok', received: 'done', cancelled: 'flash' }; return m[s] || 'info'; }
  getPOStatusLabel(s: string) { const m: any = { draft: 'Nháp', approved: 'Đã duyệt', received: 'Đã nhận', cancelled: 'Đã hủy' }; return m[s] || s; }

  saveSupplier() {
    this.inv.addSupplier(this.newSupplier);
    this.showSupplierForm.set(false);
    this.newSupplier = { name: '', contactPerson: '', phone: '', email: '', address: '' };
  }
  confirmDeleteSupplier(id: number) { this.deleteTargetId.set(id); this.showDeleteConfirm.set(true); }
  doDelete() { this.inv.deleteSupplier(this.deleteTargetId()); this.showDeleteConfirm.set(false); }
  onPageChange(p: number) { this.currentPage.set(p); }
}

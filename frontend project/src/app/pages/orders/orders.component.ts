import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../core/models/entities';
import { VndCurrencyPipe } from '../../shared/pipes/vnd-currency.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, VndCurrencyPipe, RelativeTimePipe, PaginationComponent, ConfirmDialogComponent],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent {
  searchTerm = signal('');
  channelFilter = signal('');
  statusFilter = signal('');
  currentPage = signal(1);
  pageSize = 10;
  showDetail = signal(false);
  selectedOrder = signal<Order | null>(null);
  showStatusChange = signal(false);
  newStatus = signal<OrderStatus>('confirmed');

  filteredOrders = computed(() => {
    let list = this.orderService.getOrders();
    const s = this.searchTerm().toLowerCase();
    if (s) list = list.filter(o => o.code.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s));
    if (this.channelFilter()) list = list.filter(o => o.channel === this.channelFilter());
    if (this.statusFilter()) list = list.filter(o => o.status === this.statusFilter());
    return list;
  });

  paginatedOrders = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredOrders().slice(start, start + this.pageSize);
  });

  kpis = computed(() => {
    const all = this.orderService.getOrders();
    return {
      today: all.length,
      pending: all.filter(o => ['new', 'pending_payment'].includes(o.status)).length,
      completionRate: Math.round(all.filter(o => o.status === 'completed').length / all.length * 100),
      cancelled: all.filter(o => ['cancelled', 'returned'].includes(o.status)).length,
    };
  });

  channels = ['Shopee', 'TikTok', 'Website', 'POS', 'Lazada', 'Facebook', 'Tiki'];
  statuses: OrderStatus[] = ['new', 'confirmed', 'pending_payment', 'paid', 'processing', 'packing', 'shipping', 'delivered', 'completed', 'cancelled', 'returned'];

  constructor(public orderService: OrderService) { }

  openDetail(o: Order) { this.selectedOrder.set(o); this.showDetail.set(true); }
  closeDetail() { this.showDetail.set(false); }

  getChannelClass(ch: string) { return this.orderService.getChannelClass(ch); }
  getStatusLabel(s: OrderStatus) { return this.orderService.getStatusLabel(s); }
  getStatusClass(s: OrderStatus) { return this.orderService.getStatusClass(s); }

  getSlaRemaining(deadline: Date): string {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return 'Quá hạn!';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }
  isSlaUrgent(deadline: Date): boolean { return new Date(deadline).getTime() - Date.now() < 3600000; }

  getStatusFlow() { return this.orderService.getStatusFlow(); }
  getStepIndex(status: OrderStatus) { return this.getStatusFlow().indexOf(status); }

  changeStatus(orderId: number, status: OrderStatus) {
    this.orderService.updateStatus(orderId, status);
    if (this.selectedOrder()?.id === orderId) {
      this.selectedOrder.set(this.orderService.getOrder(orderId) || null);
    }
  }
  onPageChange(p: number) { this.currentPage.set(p); }
}

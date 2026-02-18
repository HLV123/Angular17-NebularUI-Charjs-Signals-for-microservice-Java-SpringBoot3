import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { CustomerService } from '../../core/services/customer.service';
import { ChannelService } from '../../core/services/channel.service';
import { FinanceService } from '../../core/services/finance.service';
import { VndCurrencyPipe } from '../../shared/pipes/vnd-currency.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard', standalone: true,
  imports: [CommonModule, VndCurrencyPipe, RelativeTimePipe],
  templateUrl: './dashboard.component.html', styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('miniRevenueChart') miniRevenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('miniChannelChart') miniChannelCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    public orderSvc: OrderService, public productSvc: ProductService,
    public customerSvc: CustomerService, public channelSvc: ChannelService,
    public financeSvc: FinanceService
  ) { }

  get kpis() {
    const orders = this.orderSvc.getOrders();
    const fin = this.financeSvc.getSummary();
    return {
      revenue: fin.income, orders: orders.length,
      avgOrder: Math.round(fin.income / orders.length),
      customers: this.customerSvc.getCustomers().length,
      pending: orders.filter(o => ['new', 'pending_payment'].includes(o.status)).length,
      profit: fin.profit,
    };
  }

  get recentOrders() { return this.orderSvc.getOrders().slice(0, 5); }
  get lowStockProducts() { return this.productSvc.getProducts().filter(p => p.stock < 20).slice(0, 5); }

  getStatusLabel(s: any) { return this.orderSvc.getStatusLabel(s); }
  getStatusClass(s: any) { return this.orderSvc.getStatusClass(s); }
  getChannelClass(c: string) { return this.orderSvc.getChannelClass(c); }

  ngAfterViewInit() {
    const data = this.financeSvc.getMonthlyData();
    new Chart(this.miniRevenueCanvas.nativeElement, {
      type: 'line',
      data: { labels: data.map(d => d.month), datasets: [{ data: data.map(d => d.income), borderColor: '#3366FF', backgroundColor: 'rgba(51,102,255,.1)', fill: true, tension: .4, borderWidth: 2, pointRadius: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
    });
    const channels = this.channelSvc.getChannels().slice(0, 5);
    new Chart(this.miniChannelCanvas.nativeElement, {
      type: 'doughnut',
      data: { labels: channels.map(c => c.name), datasets: [{ data: channels.map(c => c.revenue), backgroundColor: ['#3366FF', '#FF6633', '#00D68F', '#FFAA00', '#FF3D71'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 10 } } } }, cutout: '60%' }
    });
  }
}

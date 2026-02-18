import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { CustomerService } from '../../core/services/customer.service';
import { ChannelService } from '../../core/services/channel.service';
import { FinanceService } from '../../core/services/finance.service';
import { VndCurrencyPipe } from '../../shared/pipes/vnd-currency.pipe';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics', standalone: true,
  imports: [CommonModule, VndCurrencyPipe],
  templateUrl: './analytics.component.html', styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements AfterViewInit {
  @ViewChild('revenueChart') revenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('channelChart') channelCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('orderStatusChart') orderStatusCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    public orderSvc: OrderService, public productSvc: ProductService,
    public customerSvc: CustomerService, public channelSvc: ChannelService,
    public financeSvc: FinanceService
  ) { }

  get kpis() {
    const orders = this.orderSvc.getOrders();
    const customers = this.customerSvc.getCustomers();
    return {
      totalRevenue: orders.reduce((s, o) => s + o.total, 0),
      totalOrders: orders.length,
      conversionRate: 3.2,
      avgOrderValue: Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length),
      totalCustomers: customers.length,
      returningRate: Math.round(customers.filter(c => c.totalOrders > 1).length / customers.length * 100),
    };
  }

  get topProducts() {
    return this.productSvc.getProducts().sort((a, b) => b.sold - a.sold).slice(0, 5);
  }

  get topCustomers() {
    return this.customerSvc.getCustomers().sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }

  ngAfterViewInit() {
    this.createRevenueChart();
    this.createChannelChart();
    this.createCategoryChart();
    this.createOrderStatusChart();
  }

  createRevenueChart() {
    const data = this.financeSvc.getMonthlyData();
    new Chart(this.revenueCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: data.map(d => d.month),
        datasets: [
          { label: 'Doanh thu', data: data.map(d => d.income), borderColor: '#3366FF', backgroundColor: 'rgba(51,102,255,.1)', fill: true, tension: .4, borderWidth: 2 },
          { label: 'Chi phí', data: data.map(d => d.expense), borderColor: '#FF3D71', backgroundColor: 'rgba(255,61,113,.05)', fill: true, tension: .4, borderWidth: 2 },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => (v / 1000000000).toFixed(1) + 'B' } } } }
    });
  }

  createChannelChart() {
    const channels = this.channelSvc.getChannels();
    const colors = ['#3366FF', '#FF6633', '#00D68F', '#FFAA00', '#FF3D71', '#8F9BB3', '#0095FF', '#FFD93D'];
    new Chart(this.channelCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: channels.map(c => c.name),
        datasets: [{ data: channels.map(c => c.revenue), backgroundColor: colors, borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
    });
  }

  createCategoryChart() {
    const products = this.productSvc.getProducts();
    const cats = [...new Set(products.map(p => p.category))];
    const catRevenue = cats.map(c => products.filter(p => p.category === c).reduce((s, p) => s + p.sold * p.price, 0));
    const colors = ['#3366FF', '#FF6633', '#00D68F', '#FFAA00', '#FF3D71', '#8F9BB3', '#0095FF', '#FFD93D'];
    new Chart(this.categoryCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: cats,
        datasets: [{ label: 'Doanh thu theo danh mục', data: catRevenue, backgroundColor: colors.slice(0, cats.length), borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => (v / 1000000).toFixed(0) + 'M' } } } }
    });
  }

  createOrderStatusChart() {
    const orders = this.orderSvc.getOrders();
    const statuses = ['completed', 'processing', 'shipping', 'new', 'cancelled'];
    const labels = statuses.map(s => this.orderSvc.getStatusLabel(s as any));
    const data = statuses.map(s => orders.filter(o => o.status === s).length);
    const colors = ['#00D68F', '#3366FF', '#FFAA00', '#0095FF', '#FF3D71'];
    new Chart(this.orderStatusCanvas.nativeElement, {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
    });
  }
}

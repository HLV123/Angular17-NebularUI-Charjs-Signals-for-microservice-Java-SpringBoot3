import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { FinanceService } from '../../core/services/finance.service';
import { VndCurrencyPipe } from '../../shared/pipes/vnd-currency.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

Chart.register(...registerables);

@Component({
  selector: 'app-finance', standalone: true,
  imports: [CommonModule, VndCurrencyPipe, RelativeTimePipe],
  templateUrl: './finance.component.html', styleUrls: ['./finance.component.scss']
})
export class FinanceComponent implements AfterViewInit {
  @ViewChild('finChart') finCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(public fin: FinanceService) { }

  get summary() { return this.fin.getSummary(); }
  getTypeClass(t: string) { const m: any = { income: 'ok', expense: 'wait', refund: 'flash' }; return m[t] || 'info'; }
  getTypeLabel(t: string) { const m: any = { income: 'Thu', expense: 'Chi', refund: 'Hoàn' }; return m[t] || t; }

  ngAfterViewInit() {
    const data = this.fin.getMonthlyData();
    new Chart(this.finCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map(d => d.month),
        datasets: [
          { label: 'Thu', data: data.map(d => d.income), backgroundColor: 'rgba(0,214,143,.7)', borderRadius: 4 },
          { label: 'Chi', data: data.map(d => d.expense), backgroundColor: 'rgba(255,61,113,.7)', borderRadius: 4 },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => (v / 1000000000).toFixed(1) + 'B' } } } }
    });
  }
}

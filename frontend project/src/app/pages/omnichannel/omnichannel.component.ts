import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelService } from '../../core/services/channel.service';
import { VndCurrencyPipe } from '../../shared/pipes/vnd-currency.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-omnichannel', standalone: true,
  imports: [CommonModule, VndCurrencyPipe, RelativeTimePipe],
  templateUrl: './omnichannel.component.html', styleUrls: ['./omnichannel.component.scss']
})
export class OmnichannelComponent {
  constructor(public ch: ChannelService) { }
  get totalRevenue() { return this.ch.getChannels().reduce((s, c) => s + c.revenue, 0); }
  get totalOrders() { return this.ch.getChannels().reduce((s, c) => s + c.orders, 0); }
  get connectedCount() { return this.ch.getChannels().filter(c => c.status === 'connected').length; }
  getChannelShare(revenue: number) { return this.totalRevenue ? (revenue / this.totalRevenue * 100).toFixed(1) : '0'; }
}

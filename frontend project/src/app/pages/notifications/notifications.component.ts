import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-notifications', standalone: true,
  imports: [CommonModule, RelativeTimePipe],
  template: `
    <div class="page fade-in">
      <div class="page-hdr"><h2><i class="fas fa-bell" style="color:var(--p)"></i> Trung Tâm Thông Báo</h2>
        <div class="hdr-tags"><span class="proto-tag"><i class="fas fa-bolt"></i> WebSocket · Kafka</span></div></div>
      <div class="kpi-row">
        <div class="kpi"><div class="ki pr"><i class="fas fa-bell"></i></div><div><div class="kv">{{ notifSvc.notifications().length }}</div><div class="kl">Tổng thông báo</div></div></div>
        <div class="kpi"><div class="ki wr"><i class="fas fa-circle"></i></div><div><div class="kv">{{ notifSvc.unreadCount() }}</div><div class="kl">Chưa đọc</div></div></div>
      </div>
      <div class="filter-bar">
        <button [class.active]="filter() === 'all'" (click)="filter.set('all')">Tất cả</button>
        <button [class.active]="filter() === 'order'" (click)="filter.set('order')">Đơn hàng</button>
        <button [class.active]="filter() === 'inventory'" (click)="filter.set('inventory')">Kho hàng</button>
        <button [class.active]="filter() === 'system'" (click)="filter.set('system')">Hệ thống</button>
        <button style="margin-left:auto" class="btn-text" (click)="notifSvc.markAllRead()"><i class="fas fa-check-double"></i> Đánh dấu đã đọc</button>
      </div>
      <div class="notif-list">
        @for (n of filteredNotifications; track n.id) {
          <div class="notif-item" [class.unread]="!n.read" (click)="notifSvc.markRead(n.id)">
            <div class="notif-icon" [ngClass]="n.type">
              <i class="fas" [ngClass]="{'fa-shopping-bag':n.type==='order','fa-warehouse':n.type==='inventory','fa-cog':n.type==='system','fa-bullhorn':n.type==='marketing'}"></i>
            </div>
            <div class="notif-content">
              <p>{{ n.message }}</p>
              <span class="hint">{{ n.time | relativeTime }}</span>
            </div>
            @if (!n.read) { <div class="unread-dot"></div> }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @use '../../pages/products/products.component.scss';
    .filter-bar { display:flex; gap:.4rem; margin-bottom:1rem; align-items:center; flex-wrap:wrap;
      button { padding:.45rem .8rem; border:1px solid var(--brd); border-radius:2rem; background:#fff; font-size:.8rem; cursor:pointer; font-weight:500; transition:all .15s;
        &.active { background:var(--p); color:#fff; border-color:var(--p); }
        &:hover:not(.active) { border-color:var(--p); color:var(--p); }
      }
      .btn-text { background:none; border:none; color:var(--p); cursor:pointer; font-size:.82rem; padding:.4rem .6rem; &:hover { text-decoration:underline; } }
    }
    .notif-list { display:flex; flex-direction:column; gap:.3rem; }
    .notif-item { display:flex; align-items:center; gap:.8rem; padding:.8rem 1rem; background:#fff; border-radius:.8rem; border:1px solid var(--bl); cursor:pointer; transition:all .15s;
      &:hover { border-color:var(--p); background:var(--ph); }
      &.unread { background:#F0F5FF; border-color:rgba(51,102,255,.15); }
      .notif-icon { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:.85rem; flex-shrink:0;
        &.order { background:#3366FF; } &.inventory { background:#FFAA00; } &.system { background:#8F9BB3; } &.marketing { background:#00D68F; }
      }
      .notif-content { flex:1; p { margin:0; font-size:.85rem; } }
      .unread-dot { width:8px; height:8px; border-radius:50%; background:var(--p); flex-shrink:0; }
    }
  `]
})
export class NotificationsComponent {
  filter = signal('all');
  constructor(public notifSvc: NotificationService) { }
  get filteredNotifications() {
    const f = this.filter();
    return f === 'all' ? this.notifSvc.notifications() : this.notifSvc.notifications().filter(n => n.type === f);
  }
}

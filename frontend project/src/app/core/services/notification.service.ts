import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface AppNotification {
    id: number;
    type: 'order' | 'inventory' | 'system' | 'marketing' | 'alert';
    title: string;
    message: string;
    time: Date;
    read: boolean;
    icon: string;
    severity: 'info' | 'warn' | 'crit';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    notifications = signal<AppNotification[]>([
        { id: 1, type: 'order', title: 'Đơn hàng mới', message: 'Đơn #DH-9823 từ Shopee - 1.280.000₫', time: new Date(Date.now() - 300000), read: false, icon: 'fa-shopping-cart', severity: 'info' },
        { id: 2, type: 'inventory', title: 'Cảnh báo tồn kho', message: 'Áo thun basic đen sắp hết (còn 3) · Kho A', time: new Date(Date.now() - 600000), read: false, icon: 'fa-box-open', severity: 'warn' },
        { id: 3, type: 'alert', title: 'Phát hiện gian lận', message: 'Đơn #DH-9810 đã bị hold tự động', time: new Date(Date.now() - 1200000), read: false, icon: 'fa-ban', severity: 'crit' },
        { id: 4, type: 'system', title: 'Airflow DAG hoàn thành', message: 'daily_rfm_calculation chạy thành công', time: new Date(Date.now() - 3600000), read: true, icon: 'fa-check-circle', severity: 'info' },
        { id: 5, type: 'marketing', title: 'Flash sale sắp hết', message: 'Chiến dịch Flash 20h còn 30 phút', time: new Date(Date.now() - 1800000), read: false, icon: 'fa-bolt', severity: 'warn' },
    ]);

    unreadCount = signal(0);

    private alertSubject = new Subject<AppNotification>();
    alerts$ = this.alertSubject.asObservable();

    constructor() {
        this.updateUnreadCount();
    }

    markRead(id: number) {
        this.notifications.update(list =>
            list.map(n => n.id === id ? { ...n, read: true } : n)
        );
        this.updateUnreadCount();
    }

    markAllRead() {
        this.notifications.update(list =>
            list.map(n => ({ ...n, read: true }))
        );
        this.updateUnreadCount();
    }

    private updateUnreadCount() {
        this.unreadCount.set(this.notifications().filter(n => !n.read).length);
    }
}

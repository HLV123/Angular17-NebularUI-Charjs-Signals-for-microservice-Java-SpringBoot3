import { Injectable, signal } from '@angular/core';
import { SalesChannel } from '../models/entities';

const MOCK_CHANNELS: SalesChannel[] = [
    { id: 1, name: 'Shopee', type: 'marketplace', icon: 'assets/channel-shopee-sm.png', status: 'connected', orders: 3456, revenue: 1850000000, lastSync: new Date(Date.now() - 60000) },
    { id: 2, name: 'Lazada', type: 'marketplace', icon: 'assets/channel-lazada-sm.png', status: 'connected', orders: 2134, revenue: 1200000000, lastSync: new Date(Date.now() - 120000) },
    { id: 3, name: 'TikTok Shop', type: 'marketplace', icon: 'assets/channel-tiktok-sm.png', status: 'connected', orders: 1876, revenue: 980000000, lastSync: new Date(Date.now() - 300000) },
    { id: 4, name: 'Website', type: 'own', icon: 'assets/channel-pos-sm.png', status: 'connected', orders: 4521, revenue: 2500000000, lastSync: new Date() },
    { id: 5, name: 'POS Hà Nội', type: 'pos', icon: 'assets/channel-pos-sm.png', status: 'connected', orders: 1234, revenue: 650000000, lastSync: new Date() },
    { id: 6, name: 'POS TP.HCM', type: 'pos', icon: 'assets/channel-pos-sm.png', status: 'connected', orders: 2345, revenue: 1100000000, lastSync: new Date() },
    { id: 7, name: 'Facebook Shop', type: 'social', icon: 'assets/channel-facebook-sm.png', status: 'connected', orders: 876, revenue: 420000000, lastSync: new Date(Date.now() - 600000) },
    { id: 8, name: 'Tiki', type: 'marketplace', icon: 'assets/channel-tiki-sm.png', status: 'connected', orders: 987, revenue: 530000000 },
];

@Injectable({ providedIn: 'root' })
export class ChannelService {
    channels = signal<SalesChannel[]>(MOCK_CHANNELS);

    getChannels() { return this.channels(); }
    toggleChannel(id: number) {
        this.channels.update(list => list.map(c =>
            c.id === id ? { ...c, status: c.status === 'connected' ? 'disconnected' as const : 'connected' as const } : c
        ));
    }
}

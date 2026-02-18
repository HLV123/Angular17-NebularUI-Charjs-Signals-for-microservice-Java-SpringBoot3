import { Injectable, signal } from '@angular/core';
import { Campaign, Voucher } from '../models/entities';

const MOCK_CAMPAIGNS: Campaign[] = [
    { id: 1, name: 'Flash Sale 20h - Giảm sốc 50%', type: 'push', status: 'running', targetSegment: 'Champions', budget: 15000000, spent: 8700000, reach: 12500, clicks: 3200, conversions: 456, openRate: 68, clickRate: 25.6, startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 86400000), createdAt: new Date(Date.now() - 172800000) },
    { id: 2, name: 'Email: Bỏ quên giỏ hàng', type: 'email', status: 'running', targetSegment: 'All', budget: 5000000, spent: 2100000, reach: 8400, clicks: 1890, conversions: 234, openRate: 42, clickRate: 22.5, startDate: new Date(Date.now() - 604800000), endDate: new Date(Date.now() + 604800000), createdAt: new Date(Date.now() - 604800000) },
    { id: 3, name: 'Zalo ZNS: Thông báo khuyến mãi Tết', type: 'zns', status: 'scheduled', targetSegment: 'Loyal Customers', budget: 8000000, spent: 0, reach: 0, clicks: 0, conversions: 0, startDate: new Date(Date.now() + 604800000), endDate: new Date(Date.now() + 1209600000), createdAt: new Date() },
    { id: 4, name: 'SMS: Chúc mừng sinh nhật tháng 2', type: 'sms', status: 'completed', targetSegment: 'Birthday Feb', budget: 3000000, spent: 2840000, reach: 2840, clicks: 890, conversions: 145, openRate: 95, clickRate: 31.3, startDate: new Date(Date.now() - 1209600000), endDate: new Date(Date.now() - 604800000), createdAt: new Date(Date.now() - 1814400000) },
    { id: 5, name: 'Facebook Ads: Bộ sưu tập mùa xuân', type: 'facebook', status: 'paused', targetSegment: 'Potential Loyalists', budget: 20000000, spent: 12500000, reach: 45000, clicks: 5600, conversions: 312, startDate: new Date(Date.now() - 604800000), endDate: new Date(Date.now() + 604800000), createdAt: new Date(Date.now() - 604800000) },
];

const MOCK_VOUCHERS: Voucher[] = [
    { id: 1, code: 'COMBO30', name: 'Giảm 30% combo', type: 'percentage', value: 30, minOrderValue: 500000, maxDiscount: 200000, usageLimit: 500, usedCount: 342, perCustomerLimit: 1, applicableProducts: 'Tất cả', startDate: new Date(Date.now() - 604800000), endDate: new Date(Date.now() + 604800000), status: 'active' },
    { id: 2, code: 'FREESHIP50', name: 'Freeship đơn từ 300K', type: 'freeship', value: 50000, minOrderValue: 300000, usageLimit: 1000, usedCount: 567, perCustomerLimit: 3, applicableProducts: 'Tất cả', startDate: new Date(Date.now() - 1209600000), endDate: new Date(Date.now() + 1209600000), status: 'active' },
    { id: 3, code: 'NEWUSER100', name: 'Giảm 100K khách mới', type: 'fixed', value: 100000, minOrderValue: 400000, usageLimit: 200, usedCount: 89, perCustomerLimit: 1, applicableProducts: 'Tất cả', startDate: new Date(Date.now() - 2592000000), endDate: new Date(Date.now() + 604800000), status: 'active' },
    { id: 4, code: 'LOYAL500', name: 'Đổi 500 điểm', type: 'fixed', value: 50000, minOrderValue: 200000, usageLimit: 9999, usedCount: 234, perCustomerLimit: 5, applicableProducts: 'Tất cả', startDate: new Date(Date.now() - 2592000000), endDate: new Date(Date.now() + 2592000000), status: 'active' },
    { id: 5, code: 'TET2026', name: 'Tết Nguyên Đán giảm 20%', type: 'percentage', value: 20, minOrderValue: 300000, maxDiscount: 150000, usageLimit: 2000, usedCount: 2000, perCustomerLimit: 2, applicableProducts: 'Thời trang', startDate: new Date(Date.now() - 2592000000), endDate: new Date(Date.now() - 604800000), status: 'expired' },
];

@Injectable({ providedIn: 'root' })
export class MarketingService {
    campaigns = signal<Campaign[]>(MOCK_CAMPAIGNS);
    vouchers = signal<Voucher[]>(MOCK_VOUCHERS);

    getCampaigns() { return this.campaigns(); }
    getVouchers() { return this.vouchers(); }

    addCampaign(c: Partial<Campaign>) {
        const newId = Math.max(...this.campaigns().map(x => x.id)) + 1;
        const campaign: Campaign = { id: newId, name: c.name || '', type: c.type || 'email', status: 'draft', targetSegment: c.targetSegment || '', budget: c.budget || 0, spent: 0, reach: 0, clicks: 0, conversions: 0, startDate: c.startDate || new Date(), endDate: c.endDate || new Date(), createdAt: new Date() };
        this.campaigns.update(list => [campaign, ...list]);
    }

    addVoucher(v: Partial<Voucher>) {
        const newId = Math.max(...this.vouchers().map(x => x.id)) + 1;
        const voucher: Voucher = { id: newId, code: v.code || '', name: v.name || '', type: v.type || 'percentage', value: v.value || 0, minOrderValue: v.minOrderValue || 0, maxDiscount: v.maxDiscount, usageLimit: v.usageLimit || 100, usedCount: 0, perCustomerLimit: v.perCustomerLimit || 1, applicableProducts: v.applicableProducts || 'Tất cả', startDate: v.startDate || new Date(), endDate: v.endDate || new Date(), status: 'active' };
        this.vouchers.update(list => [voucher, ...list]);
    }

    deleteCampaign(id: number) { this.campaigns.update(list => list.filter(c => c.id !== id)); }
    deleteVoucher(id: number) { this.vouchers.update(list => list.filter(v => v.id !== id)); }
}

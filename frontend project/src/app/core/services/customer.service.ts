import { Injectable, signal } from '@angular/core';
import { Customer, CustomerActivity } from '../models/entities';

const MOCK_CUSTOMERS: Customer[] = [
    { id: 1, code: 'KH-001', name: 'Nguyễn Minh Anh', email: 'anh@email.com', phone: '0987654321', gender: 'Nữ', birthday: new Date('1995-03-15'), totalOrders: 28, totalSpent: 15600000, avgOrderValue: 557142, segment: 'Champions', loyaltyTier: 'Gold', loyaltyPoints: 15600, tags: ['thường mua cuối tuần', 'ưa flash sale'], addresses: [{ id: 1, label: 'Nhà', fullAddress: '123 Nguyễn Huệ, Q1, TP.HCM', isDefault: true }], createdAt: new Date('2024-06-15'), lastOrderAt: new Date(Date.now() - 300000) },
    { id: 2, code: 'KH-002', name: 'Lê Thảo Nhi', email: 'nhi@email.com', phone: '0912345678', gender: 'Nữ', totalOrders: 15, totalSpent: 8900000, avgOrderValue: 593333, segment: 'Loyal Customers', loyaltyTier: 'Silver', loyaltyPoints: 8900, tags: ['mua online'], addresses: [{ id: 2, label: 'Nhà', fullAddress: '456 Lê Lợi, Q3, TP.HCM', isDefault: true }], createdAt: new Date('2024-09-20'), lastOrderAt: new Date(Date.now() - 600000) },
    { id: 3, code: 'KH-003', name: 'Trần Hoàng Nam', email: 'nam@email.com', phone: '0901234567', gender: 'Nam', totalOrders: 42, totalSpent: 32500000, avgOrderValue: 773809, segment: 'Champions', loyaltyTier: 'Platinum', loyaltyPoints: 32500, tags: ['VIP', 'mua sỉ'], addresses: [{ id: 3, label: 'Văn phòng', fullAddress: '789 Trần Hưng Đạo, Hà Nội', isDefault: true }, { id: 4, label: 'Nhà', fullAddress: '10 Kim Mã, Ba Đình, Hà Nội', isDefault: false }], createdAt: new Date('2023-12-01'), lastOrderAt: new Date(Date.now() - 1800000) },
    { id: 4, code: 'KH-004', name: 'Phạm Thị Lan', email: 'lan@email.com', phone: '0976543210', gender: 'Nữ', totalOrders: 8, totalSpent: 4200000, avgOrderValue: 525000, segment: 'Potential Loyalists', loyaltyTier: 'Bronze', loyaltyPoints: 4200, tags: ['mỹ phẩm'], addresses: [{ id: 5, label: 'Nhà', fullAddress: '321 Nguyễn Trãi, Đà Nẵng', isDefault: true }], createdAt: new Date('2025-02-10'), lastOrderAt: new Date(Date.now() - 7200000) },
    { id: 5, code: 'KH-005', name: 'Đặng Thùy Dương', email: 'duong@email.com', phone: '0965432109', gender: 'Nữ', totalOrders: 3, totalSpent: 1650000, avgOrderValue: 550000, segment: 'Potential Loyalists', loyaltyTier: 'Bronze', loyaltyPoints: 1650, tags: ['social buyer'], addresses: [{ id: 6, label: 'Nhà', fullAddress: '654 Hai Bà Trưng, TP.HCM', isDefault: true }], createdAt: new Date('2025-10-05'), lastOrderAt: new Date(Date.now() - 120000) },
    { id: 6, code: 'KH-006', name: 'Bùi Thanh Hải', email: 'hai@email.com', phone: '0943216789', gender: 'Nam', totalOrders: 12, totalSpent: 9800000, avgOrderValue: 816666, segment: 'Loyal Customers', loyaltyTier: 'Silver', loyaltyPoints: 9800, tags: ['điện tử', 'tech'], addresses: [{ id: 7, label: 'Nhà', fullAddress: '987 Lý Thường Kiệt, Hà Nội', isDefault: true }], createdAt: new Date('2024-08-08'), lastOrderAt: new Date(Date.now() - 3600000) },
    { id: 7, code: 'KH-007', name: 'Trương Văn Tùng', email: 'tung@email.com', phone: '0932165487', gender: 'Nam', totalOrders: 5, totalSpent: 3200000, avgOrderValue: 640000, segment: 'At Risk', loyaltyTier: 'Bronze', loyaltyPoints: 3200, tags: ['thời trang'], addresses: [{ id: 8, label: 'Nhà', fullAddress: '147 Cách Mạng T8, TP.HCM', isDefault: true }], createdAt: new Date('2024-04-15'), lastOrderAt: new Date(Date.now() - 86400000) },
    { id: 8, code: 'KH-008', name: 'Nguyễn Thị Mai', email: 'mai@email.com', phone: '0918765432', gender: 'Nữ', totalOrders: 19, totalSpent: 11200000, avgOrderValue: 589473, segment: 'Loyal Customers', loyaltyTier: 'Gold', loyaltyPoints: 11200, tags: ['thực phẩm organic'], addresses: [{ id: 9, label: 'Nhà', fullAddress: '258 Nguyễn Văn Cừ, Cần Thơ', isDefault: true }], createdAt: new Date('2024-02-28'), lastOrderAt: new Date(Date.now() - 172800000) },
];

@Injectable({ providedIn: 'root' })
export class CustomerService {
    customers = signal<Customer[]>(MOCK_CUSTOMERS);

    getCustomers() { return this.customers(); }
    getCustomer(id: number) { return this.customers().find(c => c.id === id); }

    getSegments() {
        return [
            { name: 'Champions', count: 1240, color: '#00D68F', change: 12 },
            { name: 'Loyal Customers', count: 2350, color: '#3366FF', change: 5 },
            { name: 'Potential Loyalists', count: 3892, color: '#FFAA00', change: 8 },
            { name: 'At Risk', count: 432, color: '#FF3D71', change: -3 },
            { name: 'Hibernating', count: 2105, color: '#8F9BB3', change: -7 },
        ];
    }

    getLoyaltyTiers() {
        return [
            { name: 'Platinum', minPoints: 25000, discount: 15, freeShip: true, count: 45 },
            { name: 'Gold', minPoints: 10000, discount: 10, freeShip: true, count: 234 },
            { name: 'Silver', minPoints: 5000, discount: 5, freeShip: false, count: 567 },
            { name: 'Bronze', minPoints: 0, discount: 0, freeShip: false, count: 3210 },
        ];
    }

    getActivities(customerId: number): CustomerActivity[] {
        return [
            { id: 1, type: 'order', description: 'Đặt đơn hàng #DH-9823 - 1.280.000₫', channel: 'Shopee', date: new Date(Date.now() - 300000) },
            { id: 2, type: 'review', description: 'Đánh giá 5★ sản phẩm "Serum Vitamin C"', channel: 'Website', date: new Date(Date.now() - 86400000) },
            { id: 3, type: 'loyalty', description: 'Đổi 500 điểm lấy voucher LOYAL500', channel: 'Website', date: new Date(Date.now() - 172800000) },
            { id: 4, type: 'order', description: 'Đặt đơn hàng #DH-9750 - 890.000₫', channel: 'TikTok', date: new Date(Date.now() - 604800000) },
        ];
    }

    addCustomer(c: Partial<Customer>) {
        const newId = Math.max(...this.customers().map(x => x.id)) + 1;
        const customer: Customer = {
            id: newId, code: `KH-${String(newId).padStart(3, '0')}`, name: c.name || '', email: c.email || '',
            phone: c.phone || '', gender: c.gender || '', totalOrders: 0, totalSpent: 0, avgOrderValue: 0,
            segment: 'Potential Loyalists', loyaltyTier: 'Bronze', loyaltyPoints: 0, tags: [],
            addresses: [], createdAt: new Date(), lastOrderAt: undefined
        };
        this.customers.update(list => [customer, ...list]);
        return customer;
    }

    deleteCustomer(id: number) {
        this.customers.update(list => list.filter(c => c.id !== id));
    }
}

import { Injectable, signal } from '@angular/core';
import { Order, OrderStatus } from '../models/entities';

const MOCK_ORDERS: Order[] = [
    { id: 1, code: '#DH-9823', channel: 'Shopee', customerName: 'Nguyễn Minh Anh', customerPhone: '0987654321', customerEmail: 'anh@email.com', items: [{ productId: 1, sku: 'TT-OS-001-BK-M', name: 'Áo khoác bomber nam cao cấp', price: 520000, quantity: 2, total: 1040000 }, { productId: 2, sku: 'MP-VB-001-30', name: 'Serum Vitamin C 20%', price: 380000, quantity: 1, total: 380000 }], subtotal: 1420000, shippingFee: 0, discount: 140000, total: 1280000, paymentMethod: 'VNPay', paymentStatus: 'paid', status: 'confirmed', note: '', shippingAddress: '123 Nguyễn Huệ, Q1, TP.HCM', slaDeadline: new Date(Date.now() + 3600000), createdAt: new Date(Date.now() - 300000), updatedAt: new Date(Date.now() - 300000) },
    { id: 2, code: '#TT-2312', channel: 'TikTok', customerName: 'Lê Thảo Nhi', customerPhone: '0912345678', customerEmail: 'nhi@email.com', items: [{ productId: 4, sku: 'DT-TV-001-BK', name: 'Tai nghe TWS Pro Max', price: 590000, quantity: 1, total: 590000 }], subtotal: 590000, shippingFee: 82000, discount: 0, total: 672000, paymentMethod: 'COD', paymentStatus: 'cod', status: 'pending_payment', note: 'Giao giờ hành chính', shippingAddress: '456 Lê Lợi, Q3, TP.HCM', slaDeadline: new Date(Date.now() + 2700000), createdAt: new Date(Date.now() - 600000), updatedAt: new Date(Date.now() - 600000) },
    { id: 3, code: '#WEB-671', channel: 'Website', customerName: 'Trần Hoàng Nam', customerPhone: '0901234567', customerEmail: 'nam@email.com', items: [{ productId: 3, sku: 'GD-UF-001-42', name: 'Giày Air Comfort Pro', price: 980000, quantity: 1, total: 980000 }, { productId: 10, sku: 'PK-OS-001', name: 'Balo laptop chống nước', price: 650000, quantity: 1, total: 650000 }, { productId: 5, sku: 'TP-GL-001-250', name: 'Trà hoa cúc organic 250g', price: 320000, quantity: 1, total: 320000 }], subtotal: 1950000, shippingFee: 0, discount: 0, total: 2140000, paymentMethod: 'Momo', paymentStatus: 'paid', status: 'processing', note: '', shippingAddress: '789 Trần Hưng Đạo, Hà Nội', trackingNumber: 'GHN-12345678', slaDeadline: new Date(Date.now() + 7200000), createdAt: new Date(Date.now() - 1800000), updatedAt: new Date(Date.now() - 900000) },
    { id: 4, code: '#CS-54', channel: 'POS', customerName: 'Khách lẻ', customerPhone: '', customerEmail: '', items: [{ productId: 5, sku: 'TP-GL-001-100', name: 'Trà hoa cúc organic 100g', price: 150000, quantity: 2, total: 300000 }, { productId: 12, sku: 'NC-HM-001', name: 'Nến thơm sáp đậu nành', price: 180000, quantity: 1, total: 180000 }], subtotal: 480000, shippingFee: 0, discount: 25000, total: 455000, paymentMethod: 'Tiền mặt', paymentStatus: 'paid', status: 'completed', note: 'POS Hà Nội', shippingAddress: 'Cửa hàng HN', slaDeadline: new Date(Date.now() + 86400000), createdAt: new Date(Date.now() - 900000), updatedAt: new Date(Date.now() - 600000) },
    { id: 5, code: '#LZ-8834', channel: 'Lazada', customerName: 'Phạm Thị Lan', customerPhone: '0976543210', customerEmail: 'lan@email.com', items: [{ productId: 8, sku: 'MP-VB-002', name: 'Kem chống nắng SPF50+', price: 290000, quantity: 2, total: 580000 }, { productId: 2, sku: 'MP-VB-001-30', name: 'Serum Vitamin C 20%', price: 380000, quantity: 1, total: 380000 }], subtotal: 960000, shippingFee: 0, discount: 125000, total: 835000, paymentMethod: 'Ví Lazada', paymentStatus: 'paid', status: 'shipping', note: '', shippingAddress: '321 Nguyễn Trãi, Đà Nẵng', trackingNumber: 'GHTK-87654321', slaDeadline: new Date(Date.now() + 14400000), createdAt: new Date(Date.now() - 7200000), updatedAt: new Date(Date.now() - 3600000) },
    { id: 6, code: '#FB-445', channel: 'Facebook', customerName: 'Đặng Thùy Dương', customerPhone: '0965432109', customerEmail: 'duong@email.com', items: [{ productId: 9, sku: 'TN-OS-001', name: 'Váy hoa vintage retro', price: 380000, quantity: 1, total: 380000 }, { productId: 12, sku: 'NC-HM-001', name: 'Nến thơm sáp đậu nành', price: 180000, quantity: 1, total: 180000 }], subtotal: 560000, shippingFee: 30000, discount: 45000, total: 545000, paymentMethod: 'COD', paymentStatus: 'cod', status: 'new', note: 'Inbox từ Facebook', shippingAddress: '654 Hai Bà Trưng, TP.HCM', slaDeadline: new Date(Date.now() + 1800000), createdAt: new Date(Date.now() - 120000), updatedAt: new Date(Date.now() - 120000) },
    { id: 7, code: '#TK-1156', channel: 'Tiki', customerName: 'Bùi Thanh Hải', customerPhone: '0943216789', customerEmail: 'hai@email.com', items: [{ productId: 4, sku: 'DT-TV-001-WH', name: 'Tai nghe TWS Pro Max (Trắng)', price: 690000, quantity: 1, total: 690000 }], subtotal: 690000, shippingFee: 0, discount: 0, total: 690000, paymentMethod: 'VNPay', paymentStatus: 'paid', status: 'packing', note: '', shippingAddress: '987 Lý Thường Kiệt, Hà Nội', slaDeadline: new Date(Date.now() + 3600000), createdAt: new Date(Date.now() - 3600000), updatedAt: new Date(Date.now() - 1800000) },
    { id: 8, code: '#DH-9820', channel: 'Shopee', customerName: 'Trương Văn Tùng', customerPhone: '0932165487', customerEmail: 'tung@email.com', items: [{ productId: 6, sku: 'TT-OS-002', name: 'Áo sơ mi Oxford Classic', price: 420000, quantity: 3, total: 1260000 }], subtotal: 1260000, shippingFee: 0, discount: 126000, total: 1134000, paymentMethod: 'Ví ShopeePay', paymentStatus: 'paid', status: 'delivered', note: '', shippingAddress: '147 Cách Mạng T8, TP.HCM', trackingNumber: 'SPX-11223344', slaDeadline: new Date(Date.now() - 3600000), createdAt: new Date(Date.now() - 86400000), updatedAt: new Date(Date.now() - 7200000) },
    { id: 9, code: '#WEB-668', channel: 'Website', customerName: 'Nguyễn Thị Mai', customerPhone: '0918765432', customerEmail: 'mai@email.com', items: [{ productId: 11, sku: 'TP-GL-002', name: 'Mật ong rừng nguyên chất', price: 280000, quantity: 2, total: 560000 }], subtotal: 560000, shippingFee: 25000, discount: 0, total: 585000, paymentMethod: 'Chuyển khoản', paymentStatus: 'paid', status: 'completed', note: '', shippingAddress: '258 Nguyễn Văn Cừ, Cần Thơ', slaDeadline: new Date(Date.now() - 86400000), createdAt: new Date(Date.now() - 172800000), updatedAt: new Date(Date.now() - 86400000) },
    { id: 10, code: '#DH-9815', channel: 'Shopee', customerName: 'Lý Minh Đức', customerPhone: '0909876543', customerEmail: 'duc@email.com', items: [{ productId: 1, sku: 'TT-OS-001-NV-M', name: 'Áo khoác bomber nam (Navy/M)', price: 520000, quantity: 1, total: 520000 }], subtotal: 520000, shippingFee: 30000, discount: 52000, total: 498000, paymentMethod: 'VNPay', paymentStatus: 'paid', status: 'cancelled', note: 'KH yêu cầu hủy', shippingAddress: '369 Trần Phú, Nha Trang', slaDeadline: new Date(Date.now() - 172800000), createdAt: new Date(Date.now() - 259200000), updatedAt: new Date(Date.now() - 172800000) },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
    new: 'Mới', confirmed: 'Đã xác nhận', pending_payment: 'Chờ thanh toán', paid: 'Đã thanh toán',
    processing: 'Đang xử lý', packing: 'Đóng gói', shipping: 'Đang giao', shipped: 'Đã giao',
    delivered: 'Đã nhận hàng', completed: 'Hoàn thành', cancelled: 'Đã hủy', returned: 'Hoàn hàng'
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
    new: 'new', confirmed: 'ok', pending_payment: 'wait', paid: 'ok',
    processing: 'info', packing: 'info', shipping: 'ship', shipped: 'ship',
    delivered: 'done', completed: 'done', cancelled: 'flash', returned: 'wait'
};

@Injectable({ providedIn: 'root' })
export class OrderService {
    orders = signal<Order[]>(MOCK_ORDERS);

    getOrders() { return this.orders(); }
    getOrder(id: number) { return this.orders().find(o => o.id === id); }

    getStatusLabel(status: OrderStatus) { return STATUS_LABELS[status] || status; }
    getStatusClass(status: OrderStatus) { return STATUS_CLASSES[status] || 'info'; }

    getChannelClass(channel: string): string {
        const map: Record<string, string> = { 'Shopee': 'shopee', 'TikTok': 'tiktok', 'Website': 'web', 'POS': 'pos', 'Lazada': 'lazada', 'Facebook': 'fb', 'Tiki': 'tiki' };
        return map[channel] || 'web';
    }

    updateStatus(id: number, status: OrderStatus) {
        this.orders.update(list => list.map(o => o.id === id ? { ...o, status, updatedAt: new Date() } : o));
    }

    getStatusFlow(): OrderStatus[] {
        return ['new', 'confirmed', 'pending_payment', 'paid', 'processing', 'packing', 'shipping', 'delivered', 'completed'];
    }
}

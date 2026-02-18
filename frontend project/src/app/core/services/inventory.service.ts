import { Injectable, signal } from '@angular/core';
import { Warehouse, StockItem, PurchaseOrder, Supplier, StockTransfer } from '../models/entities';

const MOCK_WAREHOUSES: Warehouse[] = [
    { id: 1, name: 'Kho chính TP.HCM', code: 'WH-HCM', address: '123 Nguyễn Văn Linh, Q7, TP.HCM', type: 'physical', totalProducts: 856, totalValue: 2450000000 },
    { id: 2, name: 'Kho Hà Nội', code: 'WH-HN', address: '456 Phạm Văn Đồng, Cầu Giấy, HN', type: 'physical', totalProducts: 534, totalValue: 1280000000 },
    { id: 3, name: 'Kho Đà Nẵng', code: 'WH-DN', address: '789 Nguyễn Hữu Thọ, Đà Nẵng', type: 'physical', totalProducts: 267, totalValue: 650000000 },
    { id: 4, name: 'Virtual - Shopee', code: 'V-SPE', address: 'Phân bổ từ kho chính', type: 'virtual', totalProducts: 420, totalValue: 0 },
    { id: 5, name: 'Virtual - Lazada', code: 'V-LZD', address: 'Phân bổ từ kho chính', type: 'virtual', totalProducts: 380, totalValue: 0 },
];

const MOCK_STOCK: StockItem[] = [
    { productId: 1, sku: 'TT-OS-001', productName: 'Áo khoác bomber nam', warehouseId: 1, warehouseName: 'WH-HCM', quantity: 60, minThreshold: 20, maxThreshold: 200, lastUpdated: new Date() },
    { productId: 1, sku: 'TT-OS-001', productName: 'Áo khoác bomber nam', warehouseId: 2, warehouseName: 'WH-HN', quantity: 35, minThreshold: 15, maxThreshold: 100, lastUpdated: new Date() },
    { productId: 2, sku: 'MP-VB-001', productName: 'Serum Vitamin C 20%', warehouseId: 1, warehouseName: 'WH-HCM', quantity: 145, minThreshold: 30, maxThreshold: 300, lastUpdated: new Date() },
    { productId: 2, sku: 'MP-VB-001', productName: 'Serum Vitamin C 20%', warehouseId: 2, warehouseName: 'WH-HN', quantity: 100, minThreshold: 20, maxThreshold: 200, lastUpdated: new Date() },
    { productId: 3, sku: 'GD-UF-001', productName: 'Giày Air Comfort Pro', warehouseId: 1, warehouseName: 'WH-HCM', quantity: 55, minThreshold: 15, maxThreshold: 150, lastUpdated: new Date() },
    { productId: 3, sku: 'GD-UF-001', productName: 'Giày Air Comfort Pro', warehouseId: 3, warehouseName: 'WH-DN', quantity: 30, minThreshold: 10, maxThreshold: 80, lastUpdated: new Date() },
    { productId: 4, sku: 'DT-TV-001', productName: 'Tai nghe TWS Pro Max', warehouseId: 1, warehouseName: 'WH-HCM', quantity: 80, minThreshold: 25, maxThreshold: 200, lastUpdated: new Date() },
    { productId: 4, sku: 'DT-TV-001', productName: 'Tai nghe TWS Pro Max', warehouseId: 2, warehouseName: 'WH-HN', quantity: 41, minThreshold: 15, maxThreshold: 100, lastUpdated: new Date() },
    { productId: 5, sku: 'TP-GL-001', productName: 'Trà hoa cúc organic', warehouseId: 1, warehouseName: 'WH-HCM', quantity: 300, minThreshold: 50, maxThreshold: 500, lastUpdated: new Date() },
    { productId: 7, sku: 'DT-TV-002', productName: 'Sạc dự phòng 20000mAh', warehouseId: 1, warehouseName: 'WH-HCM', quantity: 0, minThreshold: 20, maxThreshold: 150, lastUpdated: new Date() },
    { productId: 8, sku: 'MP-VB-002', productName: 'Kem chống nắng SPF50+', warehouseId: 1, warehouseName: 'WH-HCM', quantity: 12, minThreshold: 30, maxThreshold: 200, lastUpdated: new Date() },
];

const MOCK_SUPPLIERS: Supplier[] = [
    { id: 1, name: 'OmniStyle Factory', contactPerson: 'Nguyễn Văn A', phone: '0281234567', email: 'factory@omnistyle.vn', address: 'KCN Long An', rating: 4.8, totalOrders: 156 },
    { id: 2, name: 'VietBeauty Lab', contactPerson: 'Trần Thị B', phone: '0289876543', email: 'lab@vietbeauty.vn', address: 'KCN Bình Dương', rating: 4.9, totalOrders: 89 },
    { id: 3, name: 'TechViet Electronics', contactPerson: 'Lê Văn C', phone: '0287654321', email: 'supply@techviet.vn', address: 'KCN Quế Võ, Bắc Ninh', rating: 4.5, totalOrders: 67 },
    { id: 4, name: 'GreenLife Agriculture', contactPerson: 'Phạm Thị D', phone: '0283456789', email: 'farm@greenlife.vn', address: 'Đà Lạt, Lâm Đồng', rating: 4.7, totalOrders: 45 },
];

const MOCK_PO: PurchaseOrder[] = [
    { id: 1, code: 'PO-2026-001', supplierId: 1, supplierName: 'OmniStyle Factory', warehouseId: 1, items: [{ productId: 1, sku: 'TT-OS-001', name: 'Áo khoác bomber', quantity: 200, unitPrice: 280000, total: 56000000 }, { productId: 6, sku: 'TT-OS-002', name: 'Áo sơ mi Oxford', quantity: 150, unitPrice: 190000, total: 28500000 }], status: 'approved', totalAmount: 84500000, createdAt: new Date(Date.now() - 86400000), expectedDate: new Date(Date.now() + 604800000) },
    { id: 2, code: 'PO-2026-002', supplierId: 2, supplierName: 'VietBeauty Lab', warehouseId: 1, items: [{ productId: 2, sku: 'MP-VB-001', name: 'Serum Vitamin C', quantity: 500, unitPrice: 120000, total: 60000000 }], status: 'draft', totalAmount: 60000000, createdAt: new Date(), expectedDate: new Date(Date.now() + 1209600000) },
];

const MOCK_TRANSFERS: StockTransfer[] = [
    { id: 1, code: 'ST-001', fromWarehouse: 'WH-HCM', toWarehouse: 'WH-HN', status: 'in_transit', items: [{ sku: 'TT-OS-001', name: 'Áo khoác bomber', quantity: 30 }, { sku: 'MP-VB-001', name: 'Serum Vitamin C', quantity: 50 }], createdAt: new Date(Date.now() - 172800000) },
    { id: 2, code: 'ST-002', fromWarehouse: 'WH-HCM', toWarehouse: 'WH-DN', status: 'received', items: [{ sku: 'GD-UF-001', name: 'Giày Air Comfort', quantity: 20 }], createdAt: new Date(Date.now() - 604800000) },
];

@Injectable({ providedIn: 'root' })
export class InventoryService {
    warehouses = signal<Warehouse[]>(MOCK_WAREHOUSES);
    stockItems = signal<StockItem[]>(MOCK_STOCK);
    suppliers = signal<Supplier[]>(MOCK_SUPPLIERS);
    purchaseOrders = signal<PurchaseOrder[]>(MOCK_PO);
    transfers = signal<StockTransfer[]>(MOCK_TRANSFERS);

    getWarehouses() { return this.warehouses(); }
    getStockItems() { return this.stockItems(); }
    getSuppliers() { return this.suppliers(); }
    getPurchaseOrders() { return this.purchaseOrders(); }
    getTransfers() { return this.transfers(); }

    getLowStockItems() { return this.stockItems().filter(s => s.quantity <= s.minThreshold); }
    getOutOfStockItems() { return this.stockItems().filter(s => s.quantity === 0); }

    addSupplier(s: Partial<Supplier>) {
        const newId = Math.max(...this.suppliers().map(x => x.id)) + 1;
        this.suppliers.update(list => [...list, { id: newId, name: s.name || '', contactPerson: s.contactPerson || '', phone: s.phone || '', email: s.email || '', address: s.address || '', rating: 0, totalOrders: 0 }]);
    }
    deleteSupplier(id: number) { this.suppliers.update(list => list.filter(s => s.id !== id)); }
}

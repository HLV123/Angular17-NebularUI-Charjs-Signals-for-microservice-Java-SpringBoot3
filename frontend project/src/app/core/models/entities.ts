// ===== Product Models =====
export interface Product {
    id: number; sku: string; name: string; description: string;
    category: string; brand: string; price: number; costPrice: number;
    salePrice?: number; stock: number; sold: number; rating: number;
    status: 'active' | 'inactive' | 'out_of_stock';
    images: string[]; variants: ProductVariant[];
    channels: ChannelPrice[]; createdAt: Date;
}
export interface ProductVariant {
    id: number; sku: string; attributes: Record<string, string>;
    price: number; stock: number;
}
export interface ChannelPrice {
    channel: string; price: number; enabled: boolean;
}
export interface Category {
    id: number; name: string; slug: string; parentId?: number; children?: Category[];
    productCount: number;
}

// ===== Order Models =====
export type OrderStatus = 'new' | 'confirmed' | 'pending_payment' | 'paid' | 'processing' | 'packing' | 'shipping' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'returned';
export interface Order {
    id: number; code: string; channel: string; customerName: string;
    customerPhone: string; customerEmail: string;
    items: OrderItem[]; subtotal: number; shippingFee: number;
    discount: number; total: number; paymentMethod: string;
    paymentStatus: 'paid' | 'pending' | 'cod' | 'refunded';
    status: OrderStatus; note: string;
    shippingAddress: string; trackingNumber?: string;
    slaDeadline: Date; createdAt: Date; updatedAt: Date;
}
export interface OrderItem {
    productId: number; sku: string; name: string;
    price: number; quantity: number; total: number;
}

// ===== Customer Models =====
export interface Customer {
    id: number; code: string; name: string; email: string; phone: string;
    gender: string; birthday?: Date; totalOrders: number; totalSpent: number;
    avgOrderValue: number; segment: string; loyaltyTier: string;
    loyaltyPoints: number; tags: string[]; addresses: Address[];
    createdAt: Date; lastOrderAt?: Date;
}
export interface Address {
    id: number; label: string; fullAddress: string; isDefault: boolean;
}
export interface CustomerActivity {
    id: number; type: string; description: string; channel: string; date: Date;
}

// ===== Inventory Models =====
export interface Warehouse {
    id: number; name: string; code: string; address: string;
    type: 'physical' | 'virtual'; totalProducts: number; totalValue: number;
}
export interface StockItem {
    productId: number; sku: string; productName: string; warehouseId: number;
    warehouseName: string; quantity: number; minThreshold: number;
    maxThreshold: number; lastUpdated: Date;
}
export interface PurchaseOrder {
    id: number; code: string; supplierId: number; supplierName: string;
    warehouseId: number; items: PurchaseOrderItem[]; status: 'draft' | 'approved' | 'received' | 'cancelled';
    totalAmount: number; createdAt: Date; expectedDate: Date;
}
export interface PurchaseOrderItem {
    productId: number; sku: string; name: string;
    quantity: number; unitPrice: number; total: number;
}
export interface Supplier {
    id: number; name: string; contactPerson: string; phone: string;
    email: string; address: string; rating: number; totalOrders: number;
}
export interface StockTransfer {
    id: number; code: string; fromWarehouse: string; toWarehouse: string;
    status: 'draft' | 'approved' | 'in_transit' | 'received';
    items: { sku: string; name: string; quantity: number }[];
    createdAt: Date;
}

// ===== Marketing Models =====
export interface Campaign {
    id: number; name: string; type: 'email' | 'sms' | 'zns' | 'push' | 'facebook';
    status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
    targetSegment: string; budget: number; spent: number;
    reach: number; clicks: number; conversions: number;
    openRate?: number; clickRate?: number;
    startDate: Date; endDate: Date; createdAt: Date;
}
export interface Voucher {
    id: number; code: string; name: string;
    type: 'percentage' | 'fixed' | 'freeship' | 'buy_x_get_y';
    value: number; minOrderValue: number;
    maxDiscount?: number; usageLimit: number; usedCount: number;
    perCustomerLimit: number; applicableProducts: string;
    startDate: Date; endDate: Date; status: 'active' | 'expired' | 'disabled';
}

// ===== Channel Models =====
export interface SalesChannel {
    id: number; name: string; type: string; icon: string;
    status: 'connected' | 'disconnected' | 'error';
    orders: number; revenue: number; lastSync?: Date;
}

// ===== Staff Models =====
export interface Staff {
    id: number; code: string; name: string; email: string; phone: string;
    department: string; position: string; role: string;
    warehouse?: string; status: 'active' | 'inactive';
    kpiOrders: number; kpiRevenue: number;
    joinedAt: Date;
}
export interface Role {
    id: number; name: string; label: string; permissions: Record<string, string[]>;
}
export interface Shift {
    id: number; staffId: number; staffName: string;
    date: string; startTime: string; endTime: string;
    status: 'scheduled' | 'checked_in' | 'completed';
}

// ===== Finance Models =====
export interface Transaction {
    id: number; code: string; type: 'income' | 'expense' | 'refund';
    amount: number; method: string; orderId?: number;
    description: string; status: 'completed' | 'pending' | 'failed';
    createdAt: Date;
}
export interface ReconciliationItem {
    channel: string; expected: number; actual: number;
    difference: number; status: 'matched' | 'mismatch';
}

// ===== Pipeline Models =====
export interface DagRun {
    id: string; dagId: string; name: string; schedule: string;
    status: 'success' | 'running' | 'failed' | 'scheduled';
    startTime?: Date; endTime?: Date; duration?: string;
    tasks: DagTask[];
}
export interface DagTask {
    id: string; name: string; status: 'success' | 'running' | 'failed' | 'pending';
    startTime?: Date; duration?: string;
}

// ===== Data Governance Models =====
export interface DataEntity {
    id: number; name: string; type: string; schema: string;
    classification: 'PII' | 'Financial' | 'Public' | 'Sensitive';
    owner: string; tags: string[]; lastUpdated: Date;
}
export interface RangerPolicy {
    id: number; name: string; resource: string; accessType: string;
    roles: string[]; status: 'active' | 'inactive';
    conditions: string; createdAt: Date;
}
export interface AuditLog {
    id: number; user: string; action: string; resource: string;
    result: 'allowed' | 'denied'; timestamp: Date; details: string;
}

// ===== Search Models =====
export interface SearchResult {
    id: number; type: 'product' | 'order' | 'customer';
    title: string; subtitle: string; highlights: string[];
    score: number;
}
export interface SearchAnalytics {
    keyword: string; count: number; hasResults: boolean;
    ctr: number;
}

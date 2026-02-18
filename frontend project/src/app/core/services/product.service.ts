import { Injectable, signal } from '@angular/core';
import { Product, Category, ProductVariant } from '../models/entities';

const MOCK_CATEGORIES: Category[] = [
    { id: 1, name: 'Thời trang nam', slug: 'thoi-trang-nam', productCount: 324 },
    { id: 2, name: 'Mỹ phẩm', slug: 'my-pham', productCount: 186 },
    { id: 3, name: 'Giày dép', slug: 'giay-dep', productCount: 142 },
    { id: 4, name: 'Điện tử', slug: 'dien-tu', productCount: 278 },
    { id: 5, name: 'Thực phẩm', slug: 'thuc-pham', productCount: 195 },
    { id: 6, name: 'Thời trang nữ', slug: 'thoi-trang-nu', productCount: 256 },
    { id: 7, name: 'Phụ kiện', slug: 'phu-kien', productCount: 98 },
    { id: 8, name: 'Nhà cửa', slug: 'nha-cua', productCount: 47 },
];

const MOCK_PRODUCTS: Product[] = [
    { id: 1, sku: 'TT-OS-001', name: 'Áo khoác bomber nam cao cấp', description: 'Áo khoác bomber chất liệu dù cao cấp, form regular fit', category: 'Thời trang nam', brand: 'OmniStyle', price: 520000, costPrice: 280000, salePrice: 468000, stock: 95, sold: 1240, rating: 4.8, status: 'active', images: [], variants: [{ id: 1, sku: 'TT-OS-001-BK-M', attributes: { color: 'Đen', size: 'M' }, price: 520000, stock: 30 }, { id: 2, sku: 'TT-OS-001-BK-L', attributes: { color: 'Đen', size: 'L' }, price: 520000, stock: 35 }, { id: 3, sku: 'TT-OS-001-NV-M', attributes: { color: 'Navy', size: 'M' }, price: 520000, stock: 30 }], channels: [{ channel: 'Website', price: 520000, enabled: true }, { channel: 'Shopee', price: 540000, enabled: true }, { channel: 'Lazada', price: 530000, enabled: true }], createdAt: new Date('2025-10-15') },
    { id: 2, sku: 'MP-VB-001', name: 'Serum Vitamin C 20%', description: 'Serum dưỡng trắng, mờ thâm, chống oxy hóa', category: 'Mỹ phẩm', brand: 'VietBeauty', price: 380000, costPrice: 120000, stock: 245, sold: 3420, rating: 4.9, status: 'active', images: [], variants: [{ id: 4, sku: 'MP-VB-001-30', attributes: { size: '30ml' }, price: 380000, stock: 145 }, { id: 5, sku: 'MP-VB-001-50', attributes: { size: '50ml' }, price: 520000, stock: 100 }], channels: [{ channel: 'Website', price: 380000, enabled: true }, { channel: 'Shopee', price: 399000, enabled: true }, { channel: 'TikTok', price: 385000, enabled: true }], createdAt: new Date('2025-08-20') },
    { id: 3, sku: 'GD-UF-001', name: 'Giày Air Comfort Pro', description: 'Giày thể thao công nghệ đệm Air Comfort', category: 'Giày dép', brand: 'UrbanFit', price: 980000, costPrice: 450000, stock: 85, sold: 876, rating: 4.7, status: 'active', images: [], variants: [{ id: 6, sku: 'GD-UF-001-40', attributes: { size: '40' }, price: 980000, stock: 25 }, { id: 7, sku: 'GD-UF-001-41', attributes: { size: '41' }, price: 980000, stock: 30 }, { id: 8, sku: 'GD-UF-001-42', attributes: { size: '42' }, price: 980000, stock: 30 }], channels: [{ channel: 'Website', price: 980000, enabled: true }, { channel: 'Lazada', price: 999000, enabled: true }], createdAt: new Date('2025-09-01') },
    { id: 4, sku: 'DT-TV-001', name: 'Tai nghe Bluetooth TWS Pro Max', description: 'Tai nghe true wireless chống ồn chủ động ANC', category: 'Điện tử', brand: 'TechViet', price: 690000, costPrice: 320000, salePrice: 590000, stock: 121, sold: 2156, rating: 4.6, status: 'active', images: [], variants: [{ id: 9, sku: 'DT-TV-001-BK', attributes: { color: 'Đen' }, price: 690000, stock: 65 }, { id: 10, sku: 'DT-TV-001-WH', attributes: { color: 'Trắng' }, price: 690000, stock: 56 }], channels: [{ channel: 'Website', price: 690000, enabled: true }, { channel: 'Shopee', price: 710000, enabled: true }, { channel: 'TikTok', price: 700000, enabled: true }], createdAt: new Date('2025-11-10') },
    { id: 5, sku: 'TP-GL-001', name: 'Trà hoa cúc organic', description: 'Trà thảo mộc organic 100%, nguồn gốc Đà Lạt', category: 'Thực phẩm', brand: 'GreenLife', price: 150000, costPrice: 45000, stock: 500, sold: 4567, rating: 4.9, status: 'active', images: [], variants: [{ id: 11, sku: 'TP-GL-001-100', attributes: { size: '100g' }, price: 150000, stock: 300 }, { id: 12, sku: 'TP-GL-001-250', attributes: { size: '250g' }, price: 320000, stock: 200 }], channels: [{ channel: 'Website', price: 150000, enabled: true }, { channel: 'Shopee', price: 155000, enabled: true }, { channel: 'Tiki', price: 152000, enabled: true }], createdAt: new Date('2025-07-05') },
    { id: 6, sku: 'TT-OS-002', name: 'Áo sơ mi Oxford Classic', description: 'Áo sơ mi vải Oxford dày dặn, form slim fit', category: 'Thời trang nam', brand: 'OmniStyle', price: 420000, costPrice: 190000, stock: 67, sold: 932, rating: 4.5, status: 'active', images: [], variants: [], channels: [{ channel: 'Website', price: 420000, enabled: true }], createdAt: new Date('2025-12-01') },
    { id: 7, sku: 'DT-TV-002', name: 'Sạc dự phòng 20000mAh PD 65W', description: 'Pin sạc nhanh PD 65W, hỗ trợ sạc laptop', category: 'Điện tử', brand: 'TechViet', price: 850000, costPrice: 420000, stock: 0, sold: 1890, rating: 4.4, status: 'out_of_stock', images: [], variants: [], channels: [{ channel: 'Website', price: 850000, enabled: true }, { channel: 'Shopee', price: 870000, enabled: true }], createdAt: new Date('2025-06-15') },
    { id: 8, sku: 'MP-VB-002', name: 'Kem chống nắng SPF50+ PA++++', description: 'Kem chống nắng phổ rộng, kiềm dầu 12h', category: 'Mỹ phẩm', brand: 'VietBeauty', price: 290000, costPrice: 85000, stock: 178, sold: 2876, rating: 4.8, status: 'active', images: [], variants: [], channels: [{ channel: 'Website', price: 290000, enabled: true }, { channel: 'Shopee', price: 305000, enabled: true }], createdAt: new Date('2025-09-20') },
    { id: 9, sku: 'TN-OS-001', name: 'Váy hoa vintage retro', description: 'Váy hoa phong cách vintage, chất liệu cotton', category: 'Thời trang nữ', brand: 'OmniStyle', price: 380000, costPrice: 165000, stock: 43, sold: 654, rating: 4.6, status: 'active', images: [], variants: [], channels: [{ channel: 'Website', price: 380000, enabled: true }], createdAt: new Date('2025-11-25') },
    { id: 10, sku: 'PK-OS-001', name: 'Balo laptop chống nước', description: 'Balo laptop 15.6" chống nước, chống trộm', category: 'Phụ kiện', brand: 'OmniStyle', price: 650000, costPrice: 280000, stock: 34, sold: 423, rating: 4.7, status: 'active', images: [], variants: [], channels: [{ channel: 'Website', price: 650000, enabled: true }, { channel: 'Shopee', price: 670000, enabled: true }], createdAt: new Date('2025-10-05') },
    { id: 11, sku: 'TP-GL-002', name: 'Mật ong rừng nguyên chất', description: 'Mật ong rừng tự nhiên, đóng chai 500ml', category: 'Thực phẩm', brand: 'GreenLife', price: 280000, costPrice: 120000, stock: 89, sold: 1234, rating: 4.8, status: 'active', images: [], variants: [], channels: [{ channel: 'Website', price: 280000, enabled: true }], createdAt: new Date('2025-08-10') },
    { id: 12, sku: 'NC-HM-001', name: 'Nến thơm sáp đậu nành', description: 'Nến thơm handmade từ sáp đậu nành tự nhiên', category: 'Nhà cửa', brand: 'HomeMade', price: 180000, costPrice: 55000, stock: 156, sold: 789, rating: 4.9, status: 'active', images: [], variants: [], channels: [{ channel: 'Website', price: 180000, enabled: true }], createdAt: new Date('2025-07-22') },
];

@Injectable({ providedIn: 'root' })
export class ProductService {
    products = signal<Product[]>(MOCK_PRODUCTS);
    categories = signal<Category[]>(MOCK_CATEGORIES);

    getProducts() { return this.products(); }
    getCategories() { return this.categories(); }

    getProduct(id: number) { return this.products().find(p => p.id === id); }

    addProduct(p: Partial<Product>) {
        const newId = Math.max(...this.products().map(x => x.id)) + 1;
        const sku = `NEW-${String(newId).padStart(3, '0')}`;
        const product: Product = {
            id: newId, sku, name: p.name || '', description: p.description || '',
            category: p.category || '', brand: p.brand || '', price: p.price || 0,
            costPrice: p.costPrice || 0, salePrice: p.salePrice, stock: p.stock || 0,
            sold: 0, rating: 0, status: 'active', images: [], variants: [],
            channels: [{ channel: 'Website', price: p.price || 0, enabled: true }], createdAt: new Date()
        };
        this.products.update(list => [product, ...list]);
        return product;
    }

    updateProduct(id: number, data: Partial<Product>) {
        this.products.update(list => list.map(p => p.id === id ? { ...p, ...data } : p));
    }

    deleteProduct(id: number) {
        this.products.update(list => list.filter(p => p.id !== id));
    }
}

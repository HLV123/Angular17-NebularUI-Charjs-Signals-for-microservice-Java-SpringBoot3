import { Injectable, signal } from '@angular/core';
import { Staff, Role, Shift } from '../models/entities';

const MOCK_STAFF: Staff[] = [
    { id: 1, code: 'NV-001', name: 'Nguyễn Văn Admin', email: 'admin@omnirevenue.vn', phone: '0901000001', department: 'IT', position: 'Giám đốc CNTT', role: 'SUPER_ADMIN', status: 'active', kpiOrders: 0, kpiRevenue: 0, joinedAt: new Date('2023-01-01') },
    { id: 2, code: 'NV-002', name: 'Trần Thị Quản Lý', email: 'quanly@omnirevenue.vn', phone: '0901000002', department: 'Operations', position: 'Trưởng phòng Vận hành', role: 'ADMIN', status: 'active', kpiOrders: 0, kpiRevenue: 0, joinedAt: new Date('2023-03-15') },
    { id: 3, code: 'NV-003', name: 'Lê Minh Bán Hàng', email: 'sales@omnirevenue.vn', phone: '0901000003', department: 'Sales', position: 'Trưởng phòng Kinh doanh', role: 'SALES_MGR', warehouse: 'WH-HCM', status: 'active', kpiOrders: 456, kpiRevenue: 245000000, joinedAt: new Date('2023-06-01') },
    { id: 4, code: 'NV-004', name: 'Phạm Kho Hàng', email: 'kho@omnirevenue.vn', phone: '0901000004', department: 'Warehouse', position: 'Quản lý kho', role: 'INV_MGR', warehouse: 'WH-HCM', status: 'active', kpiOrders: 234, kpiRevenue: 0, joinedAt: new Date('2023-08-10') },
    { id: 5, code: 'NV-005', name: 'Hoàng Thị Marketing', email: 'mkt@omnirevenue.vn', phone: '0901000005', department: 'Marketing', position: 'Trưởng phòng Marketing', role: 'MKT_MGR', status: 'active', kpiOrders: 0, kpiRevenue: 0, joinedAt: new Date('2024-01-15') },
    { id: 6, code: 'NV-006', name: 'Vũ Chăm Sóc', email: 'cs@omnirevenue.vn', phone: '0901000006', department: 'Support', position: 'Nhân viên CSKH', role: 'CS_AGENT', status: 'active', kpiOrders: 189, kpiRevenue: 0, joinedAt: new Date('2024-03-01') },
    { id: 7, code: 'NV-007', name: 'Đỗ Thu Ngân', email: 'pos@omnirevenue.vn', phone: '0901000007', department: 'POS', position: 'Thu ngân', role: 'CASHIER', warehouse: 'WH-HN', status: 'active', kpiOrders: 345, kpiRevenue: 178000000, joinedAt: new Date('2024-06-01') },
    { id: 8, code: 'NV-008', name: 'Ngô Phân Tích', email: 'data@omnirevenue.vn', phone: '0901000008', department: 'Data', position: 'Data Analyst', role: 'ANALYST', status: 'active', kpiOrders: 0, kpiRevenue: 0, joinedAt: new Date('2024-09-01') },
    { id: 9, code: 'NV-009', name: 'Đinh Văn Bán', email: 'dinhvan@omnirevenue.vn', phone: '0901000009', department: 'Sales', position: 'Nhân viên bán hàng', role: 'SALES_MGR', warehouse: 'WH-HN', status: 'active', kpiOrders: 312, kpiRevenue: 156000000, joinedAt: new Date('2024-04-15') },
    { id: 10, code: 'NV-010', name: 'Cao Thị Ngọc', email: 'caongoc@omnirevenue.vn', phone: '0901000010', department: 'Support', position: 'Nhân viên CSKH', role: 'CS_AGENT', status: 'inactive', kpiOrders: 67, kpiRevenue: 0, joinedAt: new Date('2024-07-20') },
];

const MOCK_SHIFTS: Shift[] = [
    { id: 1, staffId: 7, staffName: 'Đỗ Thu Ngân', date: '2026-02-18', startTime: '08:00', endTime: '16:00', status: 'checked_in' },
    { id: 2, staffId: 3, staffName: 'Lê Minh Bán Hàng', date: '2026-02-18', startTime: '09:00', endTime: '18:00', status: 'checked_in' },
    { id: 3, staffId: 9, staffName: 'Đinh Văn Bán', date: '2026-02-18', startTime: '14:00', endTime: '22:00', status: 'scheduled' },
    { id: 4, staffId: 6, staffName: 'Vũ Chăm Sóc', date: '2026-02-18', startTime: '08:00', endTime: '17:00', status: 'checked_in' },
];

@Injectable({ providedIn: 'root' })
export class StaffService {
    staff = signal<Staff[]>(MOCK_STAFF);
    shifts = signal<Shift[]>(MOCK_SHIFTS);

    getStaff() { return this.staff(); }
    getShifts() { return this.shifts(); }
    getStaffMember(id: number) { return this.staff().find(s => s.id === id); }

    getLeaderboard() {
        return this.staff()
            .filter(s => s.kpiRevenue > 0 || s.kpiOrders > 0)
            .sort((a, b) => b.kpiRevenue - a.kpiRevenue);
    }

    addStaff(s: Partial<Staff>) {
        const newId = Math.max(...this.staff().map(x => x.id)) + 1;
        const member: Staff = { id: newId, code: `NV-${String(newId).padStart(3, '0')}`, name: s.name || '', email: s.email || '', phone: s.phone || '', department: s.department || '', position: s.position || '', role: s.role || 'CS_AGENT', warehouse: s.warehouse, status: 'active', kpiOrders: 0, kpiRevenue: 0, joinedAt: new Date() };
        this.staff.update(list => [member, ...list]);
    }
    deleteStaff(id: number) { this.staff.update(list => list.filter(s => s.id !== id)); }
}

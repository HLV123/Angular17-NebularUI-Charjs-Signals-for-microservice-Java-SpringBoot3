import { Injectable, signal } from '@angular/core';
import { Transaction, ReconciliationItem } from '../models/entities';

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 1, code: 'TX-001', type: 'income', amount: 1280000, method: 'VNPay', orderId: 1, description: 'Thanh toán đơn #DH-9823', status: 'completed', createdAt: new Date(Date.now() - 300000) },
    { id: 2, code: 'TX-002', type: 'income', amount: 2140000, method: 'Momo', orderId: 3, description: 'Thanh toán đơn #WEB-671', status: 'completed', createdAt: new Date(Date.now() - 1800000) },
    { id: 3, code: 'TX-003', type: 'income', amount: 455000, method: 'Tiền mặt', orderId: 4, description: 'POS #CS-54', status: 'completed', createdAt: new Date(Date.now() - 900000) },
    { id: 4, code: 'TX-004', type: 'income', amount: 835000, method: 'Ví Lazada', orderId: 5, description: 'Thanh toán đơn #LZ-8834', status: 'completed', createdAt: new Date(Date.now() - 7200000) },
    { id: 5, code: 'TX-005', type: 'income', amount: 690000, method: 'VNPay', orderId: 7, description: 'Thanh toán đơn #TK-1156', status: 'completed', createdAt: new Date(Date.now() - 3600000) },
    { id: 6, code: 'TX-006', type: 'income', amount: 1134000, method: 'ShopeePay', orderId: 8, description: 'Thanh toán đơn #DH-9820', status: 'completed', createdAt: new Date(Date.now() - 86400000) },
    { id: 7, code: 'TX-007', type: 'expense', amount: 84500000, method: 'Chuyển khoản', description: 'Nhập hàng PO-2026-001', status: 'completed', createdAt: new Date(Date.now() - 172800000) },
    { id: 8, code: 'TX-008', type: 'refund', amount: 498000, method: 'VNPay', orderId: 10, description: 'Hoàn tiền đơn #DH-9815', status: 'completed', createdAt: new Date(Date.now() - 86400000) },
    { id: 9, code: 'TX-009', type: 'expense', amount: 15000000, method: 'Chuyển khoản', description: 'Chi phí marketing Flash Sale', status: 'completed', createdAt: new Date(Date.now() - 259200000) },
    { id: 10, code: 'TX-010', type: 'income', amount: 585000, method: 'Chuyển khoản', orderId: 9, description: 'Thanh toán đơn #WEB-668', status: 'completed', createdAt: new Date(Date.now() - 172800000) },
];

const MOCK_RECONCILIATION: ReconciliationItem[] = [
    { channel: 'VNPay', expected: 2468000, actual: 2468000, difference: 0, status: 'matched' },
    { channel: 'Momo', expected: 2140000, actual: 2140000, difference: 0, status: 'matched' },
    { channel: 'ShopeePay', expected: 1134000, actual: 1134000, difference: 0, status: 'matched' },
    { channel: 'Lazada Wallet', expected: 835000, actual: 810000, difference: 25000, status: 'mismatch' },
    { channel: 'Tiền mặt (POS)', expected: 455000, actual: 455000, difference: 0, status: 'matched' },
];

@Injectable({ providedIn: 'root' })
export class FinanceService {
    transactions = signal<Transaction[]>(MOCK_TRANSACTIONS);
    reconciliation = signal<ReconciliationItem[]>(MOCK_RECONCILIATION);

    getTransactions() { return this.transactions(); }
    getReconciliation() { return this.reconciliation(); }

    getSummary() {
        const txns = this.transactions();
        const income = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const refund = txns.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0);
        return { income, expense, refund, profit: income - expense - refund };
    }

    getMonthlyData() {
        return [
            { month: 'T8/25', income: 3200000000, expense: 1800000000 },
            { month: 'T9/25', income: 3500000000, expense: 2000000000 },
            { month: 'T10/25', income: 3800000000, expense: 2100000000 },
            { month: 'T11/25', income: 4100000000, expense: 2300000000 },
            { month: 'T12/25', income: 5200000000, expense: 2800000000 },
            { month: 'T1/26', income: 4500000000, expense: 2500000000 },
            { month: 'T2/26', income: 4820000000, expense: 2600000000 },
        ];
    }
}

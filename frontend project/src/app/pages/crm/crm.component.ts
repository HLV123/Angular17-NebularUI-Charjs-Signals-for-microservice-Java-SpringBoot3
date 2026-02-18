import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { Customer } from '../../core/models/entities';
import { VndCurrencyPipe } from '../../shared/pipes/vnd-currency.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-crm', standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, VndCurrencyPipe, RelativeTimePipe, PaginationComponent, ConfirmDialogComponent],
  templateUrl: './crm.component.html', styleUrls: ['./crm.component.scss']
})
export class CrmComponent {
  activeTab = signal<'customers' | 'segments' | 'loyalty'>('customers');
  searchTerm = signal(''); segmentFilter = signal('');
  currentPage = signal(1); pageSize = 10;
  showForm = signal(false); showDetail = signal(false);
  selectedCustomer = signal<Customer | null>(null);
  showDeleteConfirm = signal(false); deleteTargetId = signal(0);

  customerForm = this.fb.group({
    name: ['', Validators.required], email: ['', Validators.email],
    phone: ['', Validators.required], gender: ['']
  });

  constructor(public cs: CustomerService, private fb: FormBuilder) { }

  filteredCustomers = computed(() => {
    let list = this.cs.getCustomers();
    const s = this.searchTerm().toLowerCase();
    if (s) list = list.filter(c => c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.email.toLowerCase().includes(s));
    if (this.segmentFilter()) list = list.filter(c => c.segment === this.segmentFilter());
    return list;
  });
  paginatedCustomers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredCustomers().slice(start, start + this.pageSize);
  });
  kpis = computed(() => {
    const all = this.cs.getCustomers();
    return {
      total: all.length,
      totalSpent: all.reduce((s, c) => s + c.totalSpent, 0),
      avgValue: Math.round(all.reduce((s, c) => s + c.avgOrderValue, 0) / all.length),
      newThisMonth: all.filter(c => new Date(c.createdAt) > new Date(Date.now() - 2592000000)).length,
    };
  });

  segments = computed(() => this.cs.getSegments());
  loyaltyTiers = computed(() => this.cs.getLoyaltyTiers());

  openDetail(c: Customer) { this.selectedCustomer.set(c); this.showDetail.set(true); }
  closeDetail() { this.showDetail.set(false); }
  openCreate() { this.customerForm.reset(); this.showForm.set(true); }
  saveCustomer() {
    if (this.customerForm.invalid) return;
    this.cs.addCustomer(this.customerForm.value as Partial<Customer>);
    this.showForm.set(false);
  }
  confirmDelete(id: number) { this.deleteTargetId.set(id); this.showDeleteConfirm.set(true); }
  doDelete() { this.cs.deleteCustomer(this.deleteTargetId()); this.showDeleteConfirm.set(false); }
  onPageChange(p: number) { this.currentPage.set(p); }
  getSegmentColor(seg: string) { return this.segments().find(s => s.name === seg)?.color || '#999'; }
  getTierColor(tier: string) { const m: any = { Platinum: '#B76E79', Gold: '#F5A623', Silver: '#8F9BB3', Bronze: '#CD7F32' }; return m[tier] || '#999'; }
}

import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StaffService } from '../../core/services/staff.service';
import { VndCurrencyPipe } from '../../shared/pipes/vnd-currency.pipe';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-staff', standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, VndCurrencyPipe, ConfirmDialogComponent],
  templateUrl: './staff.component.html', styleUrls: ['./staff.component.scss']
})
export class StaffComponent {
  activeTab = signal<'staff' | 'shifts' | 'leaderboard'>('staff');
  searchTerm = signal(''); departmentFilter = signal('');
  showForm = signal(false); showDeleteConfirm = signal(false); deleteTargetId = signal(0);
  staffForm = this.fb.group({ name: ['', Validators.required], email: ['', Validators.email], phone: [''], department: ['', Validators.required], position: [''], role: ['CS_AGENT'], warehouse: [''] });

  constructor(public staffSvc: StaffService, private fb: FormBuilder) { }

  departments = ['IT', 'Operations', 'Sales', 'Warehouse', 'Marketing', 'Support', 'POS', 'Data'];
  filteredStaff = computed(() => {
    let list = this.staffSvc.getStaff();
    const s = this.searchTerm().toLowerCase();
    if (s) list = list.filter(st => st.name.toLowerCase().includes(s) || st.code.includes(s));
    if (this.departmentFilter()) list = list.filter(st => st.department === this.departmentFilter());
    return list;
  });

  kpis = computed(() => {
    const all = this.staffSvc.getStaff();
    return {
      total: all.length, active: all.filter(s => s.status === 'active').length,
      shifts: this.staffSvc.getShifts().filter(s => s.status === 'checked_in').length,
      departments: new Set(all.map(s => s.department)).size,
    };
  });

  getShiftStatusClass(s: string) { const m: any = { scheduled: 'wait', checked_in: 'ok', completed: 'done' }; return m[s] || 'info'; }
  getShiftStatusLabel(s: string) { const m: any = { scheduled: 'Đã lên lịch', checked_in: 'Đang làm', completed: 'Hoàn thành' }; return m[s] || s; }

  saveStaff() { if (this.staffForm.invalid) return; this.staffSvc.addStaff(this.staffForm.value as any); this.showForm.set(false); }
  confirmDelete(id: number) { this.deleteTargetId.set(id); this.showDeleteConfirm.set(true); }
  doDelete() { this.staffSvc.deleteStaff(this.deleteTargetId()); this.showDeleteConfirm.set(false); }
}

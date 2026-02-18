import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MarketingService } from '../../core/services/marketing.service';
import { VndCurrencyPipe } from '../../shared/pipes/vnd-currency.pipe';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-marketing', standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, VndCurrencyPipe, ConfirmDialogComponent],
  templateUrl: './marketing.component.html', styleUrls: ['./marketing.component.scss']
})
export class MarketingComponent {
  activeTab = signal<'campaigns' | 'vouchers'>('campaigns');
  showCampaignForm = signal(false);
  showVoucherForm = signal(false);
  showDeleteConfirm = signal(false);
  deleteTarget = signal<{ type: string, id: number }>({ type: '', id: 0 });

  campaignForm = this.fb.group({ name: ['', Validators.required], type: ['email'], targetSegment: ['', Validators.required], budget: [0, Validators.min(0)] });
  voucherForm = this.fb.group({ code: ['', Validators.required], name: ['', Validators.required], type: ['percentage'], value: [0, Validators.required], minOrderValue: [0], maxDiscount: [null], usageLimit: [100], perCustomerLimit: [1] });

  constructor(public mkt: MarketingService, private fb: FormBuilder) { }

  kpis = computed(() => {
    const camps = this.mkt.getCampaigns();
    const vouchers = this.mkt.getVouchers();
    const running = camps.filter(c => c.status === 'running');
    return {
      totalCampaigns: camps.length,
      running: running.length,
      totalReach: running.reduce((s, c) => s + c.reach, 0),
      activeVouchers: vouchers.filter(v => v.status === 'active').length,
    };
  });

  getStatusClass(s: string) { const m: any = { draft: 'wait', scheduled: 'info', running: 'ok', completed: 'done', paused: 'wait' }; return m[s] || 'info'; }
  getStatusLabel(s: string) { const m: any = { draft: 'Nháp', scheduled: 'Đã lên lịch', running: 'Đang chạy', completed: 'Hoàn thành', paused: 'Tạm dừng' }; return m[s] || s; }
  getTypeIcon(t: string) { const m: any = { email: 'fa-envelope', sms: 'fa-mobile-alt', zns: 'fa-comment-dots', push: 'fa-bell', facebook: 'fa-facebook' }; return m[t] || 'fa-bullhorn'; }
  getVoucherStatusClass(s: string) { const m: any = { active: 'ok', expired: 'wait', disabled: 'flash' }; return m[s] || 'info'; }

  saveCampaign() { if (this.campaignForm.invalid) return; this.mkt.addCampaign(this.campaignForm.value as any); this.showCampaignForm.set(false); }
  saveVoucher() { if (this.voucherForm.invalid) return; this.mkt.addVoucher(this.voucherForm.value as any); this.showVoucherForm.set(false); }
  confirmDelete(type: string, id: number) { this.deleteTarget.set({ type, id }); this.showDeleteConfirm.set(true); }
  doDelete() { const t = this.deleteTarget(); if (t.type === 'campaign') this.mkt.deleteCampaign(t.id); else this.mkt.deleteVoucher(t.id); this.showDeleteConfirm.set(false); }
}

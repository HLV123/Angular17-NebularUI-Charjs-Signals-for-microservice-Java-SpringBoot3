import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataEntity, RangerPolicy, AuditLog } from '../../core/models/entities';

const MOCK_ENTITIES: DataEntity[] = [
  { id: 1, name: 'customers', type: 'Table', schema: 'omni_db', classification: 'PII', owner: 'Data Team', tags: ['has-pii', 'crm'], lastUpdated: new Date() },
  { id: 2, name: 'orders', type: 'Table', schema: 'omni_db', classification: 'Financial', owner: 'Data Team', tags: ['financial', 'transactional'], lastUpdated: new Date() },
  { id: 3, name: 'products', type: 'Table', schema: 'omni_db', classification: 'Public', owner: 'Product Team', tags: ['catalog'], lastUpdated: new Date() },
  { id: 4, name: 'transactions', type: 'Table', schema: 'omni_db', classification: 'Financial', owner: 'Finance Team', tags: ['financial', 'sensitive'], lastUpdated: new Date() },
  { id: 5, name: 'staff', type: 'Table', schema: 'omni_db', classification: 'PII', owner: 'HR Team', tags: ['has-pii', 'internal'], lastUpdated: new Date() },
  { id: 6, name: 'analytics_events', type: 'Topic', schema: 'kafka', classification: 'Sensitive', owner: 'Data Team', tags: ['streaming', 'events'], lastUpdated: new Date() },
];

const MOCK_POLICIES: RangerPolicy[] = [
  { id: 1, name: 'PII Read Restriction', resource: 'customers.*', accessType: 'SELECT', roles: ['ADMIN', 'CS_AGENT'], status: 'active', conditions: 'Chỉ đọc dữ liệu PII masked', createdAt: new Date() },
  { id: 2, name: 'Finance Access', resource: 'transactions.*', accessType: 'ALL', roles: ['ADMIN', 'SUPER_ADMIN'], status: 'active', conditions: 'Full access cho Finance team', createdAt: new Date() },
  { id: 3, name: 'Product Catalog Read', resource: 'products.*', accessType: 'SELECT', roles: ['ALL'], status: 'active', conditions: 'Public access', createdAt: new Date() },
];

const MOCK_AUDIT: AuditLog[] = [
  { id: 1, user: 'admin@omni.vn', action: 'SELECT', resource: 'customers.phone', result: 'allowed', timestamp: new Date(Date.now() - 60000), details: 'Truy vấn SĐT khách hàng KH-001' },
  { id: 2, user: 'cs@omni.vn', action: 'SELECT', resource: 'customers.email', result: 'allowed', timestamp: new Date(Date.now() - 120000), details: 'Xem email khách hàng KH-003' },
  { id: 3, user: 'analyst@omni.vn', action: 'SELECT', resource: 'transactions.amount', result: 'denied', timestamp: new Date(Date.now() - 300000), details: 'Analyst cố gắng truy cập dữ liệu tài chính' },
  { id: 4, user: 'mkt@omni.vn', action: 'SELECT', resource: 'customers.*', result: 'allowed', timestamp: new Date(Date.now() - 600000), details: 'Truy vấn list khách hàng cho campaign' },
];

@Component({
  selector: 'app-data-governance', standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page fade-in">
      <div class="page-hdr"><h2><i class="fas fa-shield-alt" style="color:var(--p)"></i> Data Governance (Atlas + Ranger)</h2>
        <div class="hdr-tags"><span class="proto-tag"><i class="fas fa-bolt"></i> REST · Apache Atlas</span></div></div>
      <div class="kpi-row">
        <div class="kpi"><div class="ki pr"><i class="fas fa-database"></i></div><div><div class="kv">{{ entities.length }}</div><div class="kl">Data Entities</div></div></div>
        <div class="kpi"><div class="ki sc"><i class="fas fa-shield-alt"></i></div><div><div class="kv">{{ policies.length }}</div><div class="kl">Ranger Policies</div></div></div>
        <div class="kpi"><div class="ki wr"><i class="fas fa-user-secret"></i></div><div><div class="kv">{{ piiCount }}</div><div class="kl">PII Resources</div></div></div>
        <div class="kpi"><div class="ki dr"><i class="fas fa-ban"></i></div><div><div class="kv">{{ deniedCount }}</div><div class="kl">Denied Access</div></div></div>
      </div>

      <div class="tab-bar">
        <button [class.active]="activeTab() === 'catalog'" (click)="activeTab.set('catalog')"><i class="fas fa-th-list"></i> Data Catalog</button>
        <button [class.active]="activeTab() === 'policies'" (click)="activeTab.set('policies')"><i class="fas fa-lock"></i> Ranger Policies</button>
        <button [class.active]="activeTab() === 'audit'" (click)="activeTab.set('audit')"><i class="fas fa-clipboard-list"></i> Audit Logs</button>
      </div>

      @if (activeTab() === 'catalog') {
        <div class="card"><div class="card-body p0"><table class="dtbl"><thead><tr><th>Entity</th><th>Type</th><th>Schema</th><th>Classification</th><th>Owner</th><th>Tags</th></tr></thead><tbody>
          @for (e of entities; track e.id) {
            <tr><td class="fw">{{ e.name }}</td><td>{{ e.type }}</td><td class="hint">{{ e.schema }}</td>
            <td><span class="sb" [ngClass]="getClassClass(e.classification)">{{ e.classification }}</span></td>
            <td>{{ e.owner }}</td>
            <td>@for (t of e.tags; track t) { <span class="sb info" style="margin-right:.2rem;font-size:.7rem">{{ t }}</span> }</td></tr>
          }
        </tbody></table></div></div>
      }
      @if (activeTab() === 'policies') {
        <div class="card"><div class="card-body p0"><table class="dtbl"><thead><tr><th>Policy</th><th>Resource</th><th>Access</th><th>Roles</th><th>Conditions</th><th>Status</th></tr></thead><tbody>
          @for (p of policies; track p.id) {
            <tr><td class="fw">{{ p.name }}</td><td class="hint">{{ p.resource }}</td><td>{{ p.accessType }}</td>
            <td>@for (r of p.roles; track r) { <span class="sb info" style="margin-right:.2rem;font-size:.7rem">{{ r }}</span> }</td>
            <td class="hint">{{ p.conditions }}</td>
            <td><span class="sb" [ngClass]="p.status === 'active' ? 'ok' : 'wait'">{{ p.status }}</span></td></tr>
          }
        </tbody></table></div></div>
      }
      @if (activeTab() === 'audit') {
        <div class="card"><div class="card-body p0"><table class="dtbl"><thead><tr><th>User</th><th>Action</th><th>Resource</th><th>Result</th><th>Details</th><th>Time</th></tr></thead><tbody>
          @for (a of auditLogs; track a.id) {
            <tr><td class="fw">{{ a.user }}</td><td>{{ a.action }}</td><td class="hint">{{ a.resource }}</td>
            <td><span class="sb" [ngClass]="a.result === 'allowed' ? 'ok' : 'flash'"><i class="fas" [ngClass]="a.result === 'allowed' ? 'fa-check' : 'fa-ban'"></i> {{ a.result }}</span></td>
            <td class="hint">{{ a.details }}</td><td class="hint">{{ a.timestamp | date:'HH:mm:ss' }}</td></tr>
          }
        </tbody></table></div></div>
      }
    </div>
  `,
  styles: [`
    @use '../../pages/products/products.component.scss';
    @use '../../pages/inventory/inventory.component.scss';
  `]
})
export class DataGovernanceComponent {
  activeTab = signal<'catalog' | 'policies' | 'audit'>('catalog');
  entities = MOCK_ENTITIES;
  policies = MOCK_POLICIES;
  auditLogs = MOCK_AUDIT;
  get piiCount() { return this.entities.filter(e => e.classification === 'PII').length; }
  get deniedCount() { return this.auditLogs.filter(a => a.result === 'denied').length; }
  getClassClass(c: string) { const m: any = { PII: 'flash', Financial: 'wait', Public: 'ok', Sensitive: 'wr' }; return m[c] || 'info'; }
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DagRun, DagTask } from '../../core/models/entities';

const MOCK_DAGS: DagRun[] = [
  {
    id: 'dag-1', dagId: 'etl_sales_daily', name: 'ETL Sales Daily', schedule: '0 2 * * *', status: 'success', startTime: new Date(Date.now() - 3600000), endTime: new Date(Date.now() - 1800000), duration: '30m', tasks: [
      { id: 't1', name: 'extract_shopee', status: 'success', startTime: new Date(Date.now() - 3600000), duration: '5m' }, { id: 't2', name: 'extract_lazada', status: 'success', startTime: new Date(Date.now() - 3300000), duration: '4m' },
      { id: 't3', name: 'transform_orders', status: 'success', startTime: new Date(Date.now() - 2700000), duration: '10m' }, { id: 't4', name: 'load_warehouse', status: 'success', startTime: new Date(Date.now() - 2100000), duration: '8m' },
      { id: 't5', name: 'update_analytics', status: 'success', startTime: new Date(Date.now() - 1800000), duration: '3m' },
    ]
  },
  {
    id: 'dag-2', dagId: 'sync_inventory', name: 'Sync Inventory Cross-warehouse', schedule: '*/30 * * * *', status: 'running', startTime: new Date(Date.now() - 180000), duration: '3m', tasks: [
      { id: 't6', name: 'fetch_wh_hcm', status: 'success', duration: '1m' }, { id: 't7', name: 'fetch_wh_hn', status: 'success', duration: '1m' }, { id: 't8', name: 'compare_stock', status: 'running' }, { id: 't9', name: 'alert_low_stock', status: 'pending' },
    ]
  },
  {
    id: 'dag-3', dagId: 'customer_segmentation', name: 'RFM Customer Segmentation', schedule: '0 4 * * 1', status: 'scheduled', tasks: [
      { id: 't10', name: 'extract_customers', status: 'pending' }, { id: 't11', name: 'compute_rfm', status: 'pending' }, { id: 't12', name: 'assign_segments', status: 'pending' }, { id: 't13', name: 'update_crm', status: 'pending' },
    ]
  },
  {
    id: 'dag-4', dagId: 'marketing_report', name: 'Marketing Report Weekly', schedule: '0 8 * * 1', status: 'failed', startTime: new Date(Date.now() - 86400000), endTime: new Date(Date.now() - 84600000), duration: '30m', tasks: [
      { id: 't14', name: 'fetch_campaign_data', status: 'success', duration: '5m' }, { id: 't15', name: 'compute_roi', status: 'success', duration: '8m' }, { id: 't16', name: 'generate_report', status: 'failed', duration: '15m' }, { id: 't17', name: 'send_email', status: 'pending' },
    ]
  },
];

@Component({
  selector: 'app-pipeline', standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page fade-in">
      <div class="page-hdr"><h2><i class="fas fa-project-diagram" style="color:var(--p)"></i> Data Pipeline (Airflow)</h2>
        <div class="hdr-tags"><span class="proto-tag"><i class="fas fa-bolt"></i> REST · Apache Airflow</span></div></div>
      <div class="kpi-row">
        <div class="kpi"><div class="ki pr"><i class="fas fa-stream"></i></div><div><div class="kv">{{ dags.length }}</div><div class="kl">DAGs</div></div></div>
        <div class="kpi"><div class="ki sc"><i class="fas fa-check-circle"></i></div><div><div class="kv">{{ successCount }}</div><div class="kl">Success</div></div></div>
        <div class="kpi"><div class="ki ir"><i class="fas fa-spinner"></i></div><div><div class="kv">{{ runningCount }}</div><div class="kl">Running</div></div></div>
        <div class="kpi"><div class="ki dr"><i class="fas fa-times-circle"></i></div><div><div class="kv">{{ failedCount }}</div><div class="kl">Failed</div></div></div>
      </div>

      <div class="dag-list">
        @for (dag of dags; track dag.id) {
          <div class="card dag-card" (click)="toggleDag(dag.id)">
            <div class="card-body">
              <div class="dag-header">
                <div class="dag-status-icon" [ngClass]="dag.status"><i class="fas" [ngClass]="getStatusIcon(dag.status)"></i></div>
                <div>
                  <h4>{{ dag.name }}</h4>
                  <span class="hint"><i class="fas fa-clock"></i> {{ dag.schedule }} · {{ dag.duration || 'N/A' }}</span>
                </div>
                <span class="sb" [ngClass]="getStatusClass(dag.status)" style="margin-left:auto">{{ getStatusLabel(dag.status) }}</span>
                <i class="fas fa-chevron-down toggle-icon" [class.expanded]="expandedDag() === dag.id"></i>
              </div>
              @if (expandedDag() === dag.id) {
                <div class="dag-tasks">
                  <h5>Tasks pipeline:</h5>
                  <div class="task-flow">
                    @for (task of dag.tasks; track task.id; let i = $index) {
                      <div class="task-node" [ngClass]="task.status">
                        <div class="task-dot"><i class="fas" [ngClass]="getTaskIcon(task.status)"></i></div>
                        <span>{{ task.name }}</span>
                        @if (task.duration) { <span class="hint" style="font-size:.7rem">{{ task.duration }}</span> }
                      </div>
                      @if (i < dag.tasks.length - 1) { <div class="task-arrow"><i class="fas fa-arrow-right"></i></div> }
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @use '../../pages/products/products.component.scss';
    .dag-list { display:flex; flex-direction:column; gap:.6rem; }
    .dag-card { cursor:pointer; transition:all .15s; &:hover { border-color:var(--p); }
      .dag-header { display:flex; align-items:center; gap:.8rem;
        .dag-status-icon { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff;
          &.success { background:#00D68F; } &.running { background:#3366FF; animation: pulse 1.5s infinite; } &.failed { background:#FF3D71; } &.scheduled { background:#8F9BB3; }
        }
        h4 { margin:0; }
        .toggle-icon { color:var(--ts); transition:transform .2s; &.expanded { transform:rotate(180deg); } }
      }
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
    .dag-tasks { margin-top:1rem; padding-top:1rem; border-top:1px solid var(--bl);
      h5 { margin:0 0 .8rem; font-size:.85rem; color:var(--ts); }
      .task-flow { display:flex; align-items:center; gap:.4rem; overflow-x:auto; padding:.5rem 0; }
      .task-node { display:flex; flex-direction:column; align-items:center; gap:.2rem; min-width:80px;
        .task-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.65rem; color:#fff;
          background:#8F9BB3; }
        &.success .task-dot { background:#00D68F; } &.running .task-dot { background:#3366FF; animation:pulse 1.5s infinite; } &.failed .task-dot { background:#FF3D71; }
        span { font-size:.7rem; text-align:center; }
      }
      .task-arrow { color:var(--ts); font-size:.65rem; }
    }
  `]
})
export class PipelineComponent {
  dags = MOCK_DAGS;
  expandedDag = signal<string | null>(null);

  get successCount() { return this.dags.filter(d => d.status === 'success').length; }
  get runningCount() { return this.dags.filter(d => d.status === 'running').length; }
  get failedCount() { return this.dags.filter(d => d.status === 'failed').length; }

  toggleDag(id: string) { this.expandedDag.set(this.expandedDag() === id ? null : id); }
  getStatusClass(s: string) { const m: any = { success: 'ok', running: 'info', failed: 'flash', scheduled: 'wait' }; return m[s] || 'info'; }
  getStatusLabel(s: string) { const m: any = { success: 'Thành công', running: 'Đang chạy', failed: 'Thất bại', scheduled: 'Đã lên lịch' }; return m[s] || s; }
  getStatusIcon(s: string) { const m: any = { success: 'fa-check', running: 'fa-sync fa-spin', failed: 'fa-times', scheduled: 'fa-clock' }; return m[s] || 'fa-circle'; }
  getTaskIcon(s: string) { const m: any = { success: 'fa-check', running: 'fa-sync fa-spin', failed: 'fa-times', pending: 'fa-clock' }; return m[s] || 'fa-circle'; }
}

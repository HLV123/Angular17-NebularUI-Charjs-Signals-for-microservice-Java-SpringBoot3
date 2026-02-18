import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search', standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page fade-in">
      <div class="page-hdr"><h2><i class="fas fa-search" style="color:var(--p)"></i> Tìm Kiếm Nâng Cao</h2>
        <div class="hdr-tags"><span class="proto-tag"><i class="fas fa-bolt"></i> Elasticsearch</span></div></div>
      <div class="search-hero">
        <h3>Tìm kiếm nhanh sản phẩm, đơn hàng, khách hàng...</h3>
        <div class="big-search">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Nhập từ khóa, SKU, mã đơn, tên khách hàng..." [ngModel]="query()" (ngModelChange)="query.set($event); search()">
          <select [ngModel]="searchType()" (ngModelChange)="searchType.set($event); search()">
            <option value="all">Tất cả</option>
            <option value="product">Sản phẩm</option>
            <option value="order">Đơn hàng</option>
            <option value="customer">Khách hàng</option>
          </select>
        </div>
      </div>
      @if (query().length > 0) {
        <p class="result-info">Tìm thấy <strong>{{ results().length }}</strong> kết quả cho "<em>{{ query() }}</em>"</p>
        <div class="results-list">
          @for (r of results(); track r.id) {
            <div class="result-card">
              <div class="r-icon" [ngClass]="r.type"><i class="fas" [ngClass]="r.type === 'product' ? 'fa-box' : r.type === 'order' ? 'fa-receipt' : 'fa-user'"></i></div>
              <div class="r-content">
                <h4>{{ r.title }}</h4>
                <p>{{ r.subtitle }}</p>
                @for (hl of r.highlights; track hl) { <span class="highlight">{{ hl }}</span> }
              </div>
              <span class="sb info" style="font-size:.75rem">{{ r.type === 'product' ? 'Sản phẩm' : r.type === 'order' ? 'Đơn hàng' : 'Khách hàng' }}</span>
            </div>
          }
        </div>
      } @else {
        <div class="search-keywords">
          <h4><i class="fas fa-fire" style="color:var(--w)"></i> Từ khóa phổ biến</h4>
          <div class="keyword-tags">
            @for (kw of popularKeywords; track kw) {
              <button (click)="query.set(kw); search()">{{ kw }}</button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @use '../../pages/products/products.component.scss';
    .search-hero { text-align:center; padding:2rem 0 1.5rem; h3 { font-size:1.1rem; color:var(--ts); font-weight:500; margin-bottom:1rem; } }
    .big-search { display:flex; align-items:center; max-width:700px; margin:0 auto; background:#fff; border-radius:1rem; border:2px solid var(--brd); padding:.3rem; transition:border-color .15s;
      &:focus-within { border-color:var(--p); box-shadow:0 0 0 3px rgba(51,102,255,.1); }
      i { padding:0 .8rem; color:var(--ts); font-size:1.1rem; }
      input { flex:1; border:none; outline:none; font-size:.95rem; padding:.6rem 0; font-family:inherit; }
      select { border:none; outline:none; border-left:1px solid var(--brd); padding:.5rem .8rem; font-family:inherit; font-size:.84rem; background:none; cursor:pointer; }
    }
    .result-info { font-size:.85rem; margin:1rem 0; color:var(--ts); }
    .results-list { display:flex; flex-direction:column; gap:.5rem; }
    .result-card { display:flex; align-items:center; gap:.8rem; padding:1rem; background:#fff; border-radius:.8rem; border:1px solid var(--bl); transition:all .15s; cursor:pointer;
      &:hover { border-color:var(--p); transform:translateX(4px); }
      .r-icon { width:40px; height:40px; border-radius:.6rem; display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0;
        &.product { background:#3366FF; } &.order { background:#FFAA00; } &.customer { background:#00D68F; } }
      .r-content { flex:1; h4 { margin:0; font-size:.9rem; } p { margin:.2rem 0 0; font-size:.8rem; color:var(--ts); } }
      .highlight { display:inline-block; background:#FFF3CD; padding:.1rem .4rem; border-radius:.3rem; font-size:.75rem; margin-right:.3rem; margin-top:.3rem; }
    }
    .search-keywords { margin-top:2rem; text-align:center; h4 { margin-bottom:.8rem; }
      .keyword-tags { display:flex; gap:.4rem; justify-content:center; flex-wrap:wrap;
        button { padding:.4rem .8rem; border:1px solid var(--brd); border-radius:2rem; background:#fff; cursor:pointer; font-size:.8rem; transition:all .15s;
          &:hover { background:var(--p); color:#fff; border-color:var(--p); }
        }
      }
    }
  `]
})
export class SearchComponent {
  query = signal('');
  searchType = signal('all');
  results = signal<any[]>([]);
  popularKeywords = ['Áo khoác bomber', 'Serum Vitamin C', 'Tai nghe TWS', '#DH-9823', 'Nguyễn Minh Anh', 'Trà hoa cúc'];

  search() {
    const q = this.query().toLowerCase();
    if (!q) { this.results.set([]); return; }
    const allResults = [
      { id: 1, type: 'product', title: 'Áo khoác bomber nam cao cấp', subtitle: 'SKU: TT-OS-001 · 520.000₫ · Tồn: 95', highlights: ['Thời trang nam', 'OmniStyle'], score: 9.5 },
      { id: 2, type: 'product', title: 'Serum Vitamin C 20%', subtitle: 'SKU: MP-VB-001 · 380.000₫ · Tồn: 245', highlights: ['Mỹ phẩm', 'Best seller'], score: 9.2 },
      { id: 3, type: 'product', title: 'Tai nghe Bluetooth TWS Pro Max', subtitle: 'SKU: DT-TV-001 · 690.000₫ · Tồn: 121', highlights: ['Điện tử', 'ANC'], score: 8.8 },
      { id: 4, type: 'product', title: 'Trà hoa cúc organic', subtitle: 'SKU: TP-GL-001 · 150.000₫ · Tồn: 500', highlights: ['Thực phẩm', 'Organic'], score: 8.0 },
      { id: 5, type: 'order', title: 'Đơn hàng #DH-9823', subtitle: 'Nguyễn Minh Anh · Shopee · 1.280.000₫', highlights: ['Đã xác nhận'], score: 9.0 },
      { id: 6, type: 'order', title: 'Đơn hàng #WEB-671', subtitle: 'Trần Hoàng Nam · Website · 2.140.000₫', highlights: ['Đang xử lý'], score: 8.5 },
      { id: 7, type: 'customer', title: 'Nguyễn Minh Anh', subtitle: 'KH-001 · 28 đơn · 15.600.000₫', highlights: ['Champions', 'Gold'], score: 9.1 },
      { id: 8, type: 'customer', title: 'Trần Hoàng Nam', subtitle: 'KH-003 · 42 đơn · 32.500.000₫', highlights: ['Champions', 'Platinum'], score: 8.9 },
    ];
    const filtered = allResults.filter(r =>
      r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q) || r.highlights.some(h => h.toLowerCase().includes(q))
    ).filter(r => this.searchType() === 'all' || r.type === this.searchType());
    this.results.set(filtered);
  }
}

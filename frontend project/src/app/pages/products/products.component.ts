import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/entities';
import { VndCurrencyPipe } from '../../shared/pipes/vnd-currency.pipe';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, VndCurrencyPipe, PaginationComponent, ConfirmDialogComponent, EmptyStateComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent {
  searchTerm = signal('');
  categoryFilter = signal('');
  statusFilter = signal('');
  currentPage = signal(1);
  pageSize = 10;

  showForm = signal(false);
  showDetail = signal(false);
  editingProduct = signal<Product | null>(null);
  selectedProduct = signal<Product | null>(null);
  showDeleteConfirm = signal(false);
  deleteTargetId = signal(0);
  activeTab = signal<'info' | 'variants' | 'pricing'>('info');

  productForm: FormGroup;

  filteredProducts = computed(() => {
    let list = this.productService.getProducts();
    const search = this.searchTerm().toLowerCase();
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search));
    if (this.categoryFilter()) list = list.filter(p => p.category === this.categoryFilter());
    if (this.statusFilter()) list = list.filter(p => p.status === this.statusFilter());
    return list;
  });

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  categories = computed(() => this.productService.getCategories());

  kpis = computed(() => {
    const all = this.productService.getProducts();
    return {
      total: all.length,
      active: all.filter(p => p.status === 'active').length,
      outOfStock: all.filter(p => p.status === 'out_of_stock').length,
      categories: this.categories().length,
    };
  });

  constructor(private productService: ProductService, private fb: FormBuilder) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: ['', Validators.required],
      brand: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(1000)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      salePrice: [null],
      stock: [0, [Validators.required, Validators.min(0)]],
    });
  }

  openCreate() {
    this.editingProduct.set(null);
    this.productForm.reset({ price: 0, costPrice: 0, stock: 0 });
    this.showForm.set(true);
    this.activeTab.set('info');
  }

  openEdit(p: Product) {
    this.editingProduct.set(p);
    this.productForm.patchValue(p);
    this.showForm.set(true);
    this.activeTab.set('info');
  }

  openDetail(p: Product) {
    this.selectedProduct.set(p);
    this.showDetail.set(true);
  }

  closeForm() { this.showForm.set(false); }
  closeDetail() { this.showDetail.set(false); }

  saveProduct() {
    if (this.productForm.invalid) return;
    const data = this.productForm.value;
    if (this.editingProduct()) {
      this.productService.updateProduct(this.editingProduct()!.id, data);
    } else {
      this.productService.addProduct(data);
    }
    this.showForm.set(false);
  }

  confirmDelete(id: number) {
    this.deleteTargetId.set(id);
    this.showDeleteConfirm.set(true);
  }

  doDelete() {
    this.productService.deleteProduct(this.deleteTargetId());
    this.showDeleteConfirm.set(false);
  }

  onPageChange(page: number) { this.currentPage.set(page); }
}

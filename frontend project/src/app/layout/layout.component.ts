import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  user = this.auth.currentUser;
  menuSections = computed(() => this.auth.getVisibleMenuItems());

  constructor(public auth: AuthService) {}

  logout() { this.auth.logout(); }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DEMO_USERS, User } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = 'superadmin';
  password = '123456';
  error = '';
  demoUsers = DEMO_USERS;

  constructor(private auth: AuthService) {
    if (auth.isLoggedIn()) {
      const first = auth.getFirstAllowedPage(auth.currentUser()!.role);
      auth['router'].navigate(['/' + first]);
    }
  }

  login() {
    this.error = '';
    if (!this.auth.login(this.username, this.password)) {
      this.error = 'Tên đăng nhập hoặc mật khẩu không đúng';
    }
  }

  fillLogin(u: User) {
    this.username = u.username;
    this.password = '123456';
  }
}

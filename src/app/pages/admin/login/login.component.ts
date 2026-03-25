import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (this.authService.loginAdmin(this.username, this.password)) {
      this.errorMessage = '';
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.errorMessage = 'Credenciales inválidas. Intenta con admin/FitPro2026!';
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { GymUserService } from '../../../services/gym-user.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  totalProducts = 0;
  salesToday = 0;
  totalUsers = 0;
  ordersToday = 0;

  adminName = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private gymUserService: GymUserService,
    private authService: AuthService,
    private router: Router
  ) {}

  logoutAdmin() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  ngOnInit() {
    this.productService.products$.subscribe(products => {
      this.totalProducts = products.length;
    });

    this.gymUserService.users$.subscribe(users => {
      this.totalUsers = users.length;
    });

    this.authService.currentUser$.subscribe(user => {
      this.adminName = user?.username ?? '';
    });

    this.cartService.sales$.subscribe(sales => {
      const todayString = new Date().toDateString();
      const todays = sales.filter(s => new Date(s.date).toDateString() === todayString);

      this.ordersToday = todays.length;
      this.salesToday = todays.reduce((acc, sale) => acc + sale.total, 0);
    });
  }
}

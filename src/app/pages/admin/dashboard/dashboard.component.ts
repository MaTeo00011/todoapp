import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { GymUserService } from '../../../services/gym-user.service';
import { AuthService } from '../../../services/auth.service';
import { Chart, ChartConfiguration, ChartData, ChartOptions, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('salesChart', { static: false }) salesChartRef?: ElementRef<HTMLCanvasElement>;
  salesChart?: Chart<'line'>;

  totalProducts = 0;
  salesToday = 0;
  totalUsers = 0;
  ordersToday = 0;

  adminName = '';
  sidebarOpen = false;

  // Datos para el gráfico de ventas
  chartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Ventas Diarias (USD)',
        data: [],
        borderColor: '#0066FF',
        backgroundColor: 'rgba(0, 102, 255, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#0066FF',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#FFFFFF',
          font: { size: 12, weight: 600 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#0066FF',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            const value = context.parsed?.y ?? 0;
            return `$${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#B0B0B0',
          callback: function(value) {
            return '$' + value;
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        }
      },
      x: {
        ticks: {
          color: '#B0B0B0'
        },
        grid: {
          display: false
        }
      }
    }
  };

  private createChart() {
    if (!this.salesChartRef?.nativeElement) {
      return;
    }

    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: this.chartData,
      options: this.chartOptions
    };

    this.salesChart = new Chart(ctx, config);
  }

  private updateChart() {
    if (!this.salesChart) {
      return;
    }

    this.salesChart.data = this.chartData;
    this.salesChart.update();
  }

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private gymUserService: GymUserService,
    private authService: AuthService,
    private router: Router
  ) {}

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  logoutAdmin() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // Generar últimos 7 días
  private getLast7Days(): { date: Date; dateString: string }[] {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: new Date(date),
        dateString: date.toDateString()
      });
    }
    return days;
  }

  // Calcular ventas por día
  private calculateChartData(sales: any[]) {
    const last7Days = this.getLast7Days();
    const salesByDay = new Map<string, number>();

    // Inicializar todos los días con 0
    last7Days.forEach(day => {
      salesByDay.set(day.dateString, 0);
    });

    // Sumar ventas por día
    sales.forEach(sale => {
      const saleDate = new Date(sale.date).toDateString();
      if (salesByDay.has(saleDate)) {
        salesByDay.set(saleDate, (salesByDay.get(saleDate) || 0) + sale.total);
      }
    });

    // Preparar datos para el gráfico
    const labels = last7Days.map(day => {
      const date = day.date;
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    });

    const data = last7Days.map(day => salesByDay.get(day.dateString) || 0);

    // Actualizar el gráfico
    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Ventas Diarias (USD)',
          data,
          borderColor: '#0066FF',
          backgroundColor: 'rgba(0, 102, 255, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#0066FF',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }
      ]
    };
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

      // Calcular datos del gráfico de últimos 7 días
      this.calculateChartData(sales);
      if (this.salesChart) {
        this.updateChart();
      }
    });
  }

  ngAfterViewInit() {
    this.createChart();
    const existingSales = this.cartService.getSales();
    if (existingSales.length > 0) {
      this.calculateChartData(existingSales);
      this.updateChart();
    }
  }

  ngOnDestroy() {
    this.salesChart?.destroy();
  }
}


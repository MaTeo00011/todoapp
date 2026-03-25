import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService, Product } from '../../services/product.service';
import { AuthService, AppUser } from '../../services/auth.service';

// Interface para las slides del carrusel
interface CarouselSlide {
  image: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  
  products: Product[] = [];
  currentUser: AppUser | null = null;
  
  // CARRUSEL
  slides: CarouselSlide[] = [
    {
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200',
      title: '💪 Transforma Tu Cuerpo',
      subtitle: 'Los mejores suplementos para alcanzar tus objetivos'
    },
    {
      image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200',
      title: '⚡ Energía Sin Límites',
      subtitle: 'Pre-workouts que te llevarán al siguiente nivel'
    },
    {
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200',
      title: '🎯 Resultados Reales',
      subtitle: 'Calidad profesional, precios accesibles'
    },
    {
      image: 'https://images.unsplash.com/photo-1606902965551-dce093cda6e7?w=1200',  // Imagen de tarro de proteína
      title: '🏆 La Mejor Proteína',
      subtitle: '25g de proteína pura en cada porción'
    },
    {
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200',  // Nueva slide con imagen de proteína
      title: '🥛 Proteína de Alta Calidad',
      subtitle: 'Nutre tus músculos con lo mejor de la naturaleza'
    }
  ];
  
  currentSlide = 0;
  autoPlayInterval: any;
  
  isAdmin = false;

  constructor(
    public cartService: CartService,
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {}

  logoutAdmin() {
    this.authService.logout();
    this.isAdmin = false;
    this.router.navigate(['/']);
  }

  logoutUser() {
    this.authService.logout();
    this.currentUser = null;
    this.router.navigate(['/']);
  }

  ngOnInit() {
    // Cargar productos
    this.productService.products$.subscribe(products => {
      this.products = products;
    });

    // Verificar usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'admin';
    });

    // Iniciar auto-play del carrusel
    this.startAutoPlay();
  }
  
  ngOnDestroy() {
    // Limpiar interval al destruir el componente
    this.stopAutoPlay();
  }

  // ===== MÉTODOS DEL CARRUSEL =====
  
  // Iniciar reproducción automática
  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Cambia cada 5 segundos
  }
  
  // Detener reproducción automática
  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }
  
  // Siguiente slide
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }
  
  // Slide anterior
  prevSlide() {
    this.currentSlide = this.currentSlide === 0 
      ? this.slides.length - 1 
      : this.currentSlide - 1;
  }
  
  // Ir a slide específico
  goToSlide(index: number) {
    this.currentSlide = index;
  }
  
  // Pausar al pasar el mouse
  onMouseEnter() {
    this.stopAutoPlay();
  }
  
  // Reanudar al quitar el mouse
  onMouseLeave() {
    this.startAutoPlay();
  }

  // ===== MÉTODOS EXISTENTES =====
  
  addToCart(product: Product) {
    this.cartService.addToCart(product);
  }

  scrollToProducts() {
    const element = document.getElementById('productos');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  openCart() {
    this.cartService.openSidebar();
  }
}
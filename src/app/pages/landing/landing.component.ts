import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GymUserService, GymUser } from '../../services/gym-user.service';

// Interface para las slides del carrusel
interface CarouselSlide {
  image: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, OnDestroy {

  // Carrusel (igual que home)
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
      image: 'https://images.unsplash.com/photo-1606902965551-dce093cda6e7?w=1200',
      title: '🏆 La Mejor Proteína',
      subtitle: '25g de proteína pura en cada porción'
    },
    {
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200',
      title: '🥛 Proteína de Alta Calidad',
      subtitle: 'Nutre tus músculos con lo mejor de la naturaleza'
    }
  ];

  currentSlide = 0;
  autoPlayInterval: any;

  // Modal de login usuario
  showUserLogin = false;
  userName = '';
  showRegisterPrompt = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private gymUserService: GymUserService
  ) {}

  ngOnInit() {
    this.startAutoPlay();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  // ===== MÉTODOS DEL CARRUSEL =====
  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  // ===== MÉTODOS DE ACCIONES =====
  enterAsUser() {
    this.showUserLogin = true;
    this.showRegisterPrompt = false;
    this.userName = '';
  }

  enterAsAdmin() {
    this.router.navigate(['/admin/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  closeUserLogin() {
    this.showUserLogin = false;
    this.showRegisterPrompt = false;
  }

  loginAsUser() {
    if (!this.userName.trim()) {
      alert('Por favor ingresa tu nombre completo');
      return;
    }

    // Buscar usuario por nombre completo
    const users = this.gymUserService.getUsers();
    const user = users.find(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase() === this.userName.toLowerCase()
    );

    if (user) {
      // Usuario encontrado, guardar en auth y ir a tienda
      this.authService.loginUser(`${user.firstName} ${user.lastName}`);
      this.closeUserLogin();
      this.router.navigate(['/home']);
    } else {
      // Usuario no encontrado, mostrar prompt de registro
      this.showRegisterPrompt = true;
    }
  }

  goToRegisterFromModal() {
    this.closeUserLogin();
    this.goToRegister();
  }

  cancelRegisterPrompt() {
    this.showRegisterPrompt = false;
    this.userName = ''; // Limpiar el campo para un nuevo intento
  }
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GymUserService, GymUser } from '../../../services/gym-user.service';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-admin.component.html',
  styleUrl: './users-admin.component.css'
})
export class UsersAdminComponent implements OnInit, OnDestroy {

  users: GymUser[] = [];
  filteredUsers: GymUser[] = []; // Lista filtrada para mostrar
  private updateInterval: any;

  // Filtros y búsqueda
  searchTerm: string = '';
  statusFilter: string = '';
  trainingFilter: string = '';

  // Para edición
  showEditModal = false;
  editingUser: GymUser | null = null;

  // Para agregar
  showAddModal = false;
  newUser: Partial<GymUser> = {
    firstName: '',
    lastName: '',
    age: 0,
    phone: '',
    trainingType: 'general',
    paymentType: 'mes',
    paymentStart: new Date()
  };

  constructor(private gymUserService: GymUserService) {}

  ngOnInit() {
    // Cargar usuarios
    this.gymUserService.users$.subscribe((users: GymUser[]) => {
      this.users = users;
      this.applyFilters(); // Aplicar filtros cuando cambien los usuarios
    });

    // Actualizar estados cada minuto
    this.updateInterval = setInterval(() => {
      this.gymUserService.updateAllStatuses();
    }, 60000);  // 1 minuto
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  // Obtener clase CSS para el estado de pago
  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'expiring': return 'status-expiring';
      case 'expired': return 'status-expired';
      default: return '';
    }
  }

  // Obtener emoticono animado para el estado
  getStatusEmoji(status: string): string {
    switch (status) {
      case 'active': return '😊';
      case 'expiring': return '😐';
      case 'expired': return '😠';
      default: return '❓';
    }
  }

  // Formatear fecha
  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES');
  }

  // Abrir modal de edición
  openEditModal(user: GymUser) {
    this.editingUser = { ...user }; // Copia del usuario para editar
    this.showEditModal = true;
  }

  // Abrir modal de agregar
  openAddModal() {
    this.newUser = {
      firstName: '',
      lastName: '',
      age: 0,
      phone: '',
      trainingType: 'general',
      paymentType: 'mes',
      paymentStart: new Date()
    };
    this.showAddModal = true;
  }

  // Cerrar modal de edición
  closeEditModal() {
    this.showEditModal = false;
    this.editingUser = null;
  }

  // Cerrar modal de agregar
  closeAddModal() {
    this.showAddModal = false;
    this.newUser = {};
  }

  // Guardar cambios del usuario editado
  saveUserChanges() {
    if (this.editingUser) {
      this.gymUserService.updateUser(this.editingUser.id, this.editingUser);
      this.closeEditModal();
    }
  }

  // Guardar nuevo usuario
  saveNewUser() {
    if (this.newUser.firstName && this.newUser.lastName && this.newUser.age && this.newUser.phone && this.newUser.trainingType && this.newUser.paymentType && this.newUser.paymentStart) {
      this.gymUserService.addUser(this.newUser as Omit<GymUser, 'id' | 'createdAt' | 'updatedAt' | 'paymentEnd' | 'status'>);
      this.closeAddModal();
    } else {
      alert('Por favor completa todos los campos obligatorios');
    }
  }

  // Manejar cambio de tipo de entrenamiento
  onTrainingTypeChange() {
    if (this.editingUser && this.editingUser.trainingType === 'general') {
      this.editingUser.personalizedDetails = undefined;
    } else if (this.editingUser && this.editingUser.trainingType === 'personalized') {
      this.editingUser.personalizedDetails = { type: 'fuerza' };
    }
  }

  // Manejar cambio de tipo de entrenamiento para nuevo usuario
  onNewUserTrainingTypeChange() {
    if (this.newUser.trainingType === 'general') {
      this.newUser.personalizedDetails = undefined;
    } else if (this.newUser.trainingType === 'personalized') {
      this.newUser.personalizedDetails = { type: 'fuerza' };
    }
  }

  // Manejar cambio de tipo de pago (reinicia las fechas)
  onPaymentTypeChange() {
    if (this.editingUser) {
      this.editingUser.paymentStart = new Date();
      this.editingUser.updatedAt = new Date();
    }
  }

  // Manejar cambio de tipo de pago para nuevo usuario
  onNewUserPaymentTypeChange() {
    if (this.newUser) {
      this.newUser.paymentStart = new Date();
    }
  }

  // Formatear fecha para input date
  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Parsear fecha desde input date
  parseDateFromInput(dateString: string): Date {
    return new Date(dateString);
  }

  // Eliminar usuario
  deleteUser(id: number) {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.gymUserService.deleteUser(id);
    }
  }

  // Aplicar filtros y búsqueda
  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      // Filtro por búsqueda (nombre o apellidos)
      const matchesSearch = !this.searchTerm || 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Filtro por estado de pago
      const matchesStatus = !this.statusFilter || user.status === this.statusFilter;

      // Filtro por tipo de entrenamiento
      const matchesTraining = !this.trainingFilter || user.trainingType === this.trainingFilter;

      return matchesSearch && matchesStatus && matchesTraining;
    });
  }

  // Limpiar todos los filtros
  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.trainingFilter = '';
    this.applyFilters();
  }
}
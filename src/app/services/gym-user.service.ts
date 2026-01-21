import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Interface para usuarios del gimnasio
export interface GymUser {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  phone: string;  // Para WhatsApp
  trainingType: 'general' | 'personalized';
  personalizedDetails?: {
    type: 'fuerza' | 'bajar_peso' | 'definicion' | 'resistencia' | 'tonificacion';
  };
  paymentType: 'dia' | 'semana' | 'mes' | 'trimestre' | 'semestre' | 'ano';
  paymentStart: Date;
  paymentEnd: Date;
  status: 'active' | 'expiring' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GymUserService {

  // BehaviorSubject para lista de usuarios
  private users = new BehaviorSubject<GymUser[]>([]);
  users$ = this.users.asObservable();

  // ID auto-incremental
  private nextId = 1;

  constructor() {
    // Cargar usuarios del localStorage al iniciar
    this.loadUsersFromStorage();
  }

  // 📚 OBTENER todos los usuarios
  getUsers(): GymUser[] {
    return this.users.value;
  }

  // 🔍 OBTENER usuario por ID
  getUserById(id: number): GymUser | undefined {
    return this.users.value.find(u => u.id === id);
  }

  // ➕ AGREGAR nuevo usuario
  addUser(userData: Omit<GymUser, 'id' | 'createdAt' | 'updatedAt' | 'paymentEnd' | 'status'>): GymUser {
    const paymentEnd = this.calculatePaymentEnd(userData.paymentStart, userData.paymentType);
    const status = this.calculateStatus(paymentEnd);

    const newUser: GymUser = {
      ...userData,
      id: this.nextId++,
      paymentEnd,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedUsers = [...this.users.value, newUser];
    this.users.next(updatedUsers);
    this.saveUsersToStorage(updatedUsers);

    return newUser;
  }

  // ✏️ ACTUALIZAR usuario
  updateUser(id: number, updates: Partial<GymUser>): boolean {
    const users = this.users.value;
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return false;

    const updatedUser = { ...users[index], ...updates, updatedAt: new Date() };
    // Recalcular si cambió paymentType o paymentStart
    if (updates.paymentType || updates.paymentStart) {
      updatedUser.paymentEnd = this.calculatePaymentEnd(updatedUser.paymentStart, updatedUser.paymentType);
      updatedUser.status = this.calculateStatus(updatedUser.paymentEnd);
    }

    users[index] = updatedUser;
    this.users.next([...users]);
    this.saveUsersToStorage(users);
    return true;
  }

  // 🗑️ ELIMINAR usuario
  deleteUser(id: number): boolean {
    const users = this.users.value.filter(u => u.id !== id);
    if (users.length === this.users.value.length) return false;

    this.users.next(users);
    this.saveUsersToStorage(users);
    return true;
  }

  // 🔄 ACTUALIZAR estados de todos los usuarios (llamar periódicamente)
  updateAllStatuses(): void {
    const users = this.users.value.map(user => ({
      ...user,
      status: this.calculateStatus(user.paymentEnd)
    }));
    this.users.next(users);
    this.saveUsersToStorage(users);
  }

  // 🧮 Calcular fecha de fin de pago
  private calculatePaymentEnd(start: Date, type: string): Date {
    const end = new Date(start);
    switch (type) {
      case 'dia': end.setDate(end.getDate() + 1); break;
      case 'semana': end.setDate(end.getDate() + 7); break;
      case 'mes': end.setMonth(end.getMonth() + 1); break;
      case 'trimestre': end.setMonth(end.getMonth() + 3); break;
      case 'semestre': end.setMonth(end.getMonth() + 6); break;
      case 'ano': end.setFullYear(end.getFullYear() + 1); break;
    }
    return end;
  }

  // 📊 Calcular estado basado en fecha
  private calculateStatus(endDate: Date): 'active' | 'expiring' | 'expired' {
    const now = new Date();
    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'expiring';  // Últimos 3 días
    return 'active';
  }

  // 💾 Guardar en localStorage
  private saveUsersToStorage(users: GymUser[]): void {
    localStorage.setItem('gym-users', JSON.stringify(users));
  }

  // 📂 Cargar desde localStorage
  private loadUsersFromStorage(): void {
    const stored = localStorage.getItem('gym-users');
    if (stored) {
      const users: GymUser[] = JSON.parse(stored).map((u: any) => ({
        ...u,
        paymentStart: new Date(u.paymentStart),
        paymentEnd: new Date(u.paymentEnd),
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt)
      }));
      this.users.next(users);
      this.nextId = Math.max(...users.map(u => u.id), 0) + 1;
    }
  }
}
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GymUserService } from './gym-user.service';

export type UserRole = 'admin' | 'user';

export interface AppUser {
  username: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = new BehaviorSubject<AppUser | null>(null);
  currentUser$ = this.currentUser.asObservable();

  constructor(
    private gymUserService: GymUserService
  ) {
    const saved = localStorage.getItem('app-current-user');
    if (saved) {
      try {
        this.currentUser.next(JSON.parse(saved));
      } catch {
        localStorage.removeItem('app-current-user');
      }
    }
  }

  loginAdmin(username: string, password: string): boolean {
    // Credenciales estáticas para administración (puedes adaptar a API real)
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'FitPro2026!';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const user: AppUser = { username, role: 'admin' };
      this.currentUser.next(user);
      localStorage.setItem('app-current-user', JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser.next(null);
    localStorage.removeItem('app-current-user');
  }

  isAdmin(): boolean {
    const user = this.currentUser.value;
    return !!user && user.role === 'admin';
  }

  loginUser(username: string): boolean {
    // Validar que el usuario existe en la base de datos del gimnasio
    const gymUsers = this.gymUserService.getUsers();
    const userExists = gymUsers.some(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase() === username.toLowerCase() ||
      user.firstName.toLowerCase() === username.toLowerCase() ||
      user.lastName.toLowerCase() === username.toLowerCase()
    );

    if (userExists) {
      const user: AppUser = { username, role: 'user' };
      this.currentUser.next(user);
      localStorage.setItem('app-current-user', JSON.stringify(user));
      return true;
    }
    return false;
  }

  getUser(): AppUser | null {
    return this.currentUser.value;
  }
}

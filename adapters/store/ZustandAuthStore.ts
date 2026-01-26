import { injectable } from 'tsyringe';
import { IAuthStore } from '../../ports/IAuthStore';
import { User } from '../../domain/entities/User';
import { useAuthStore } from '../../store/auth-store';

/**
 * Implementación de IAuthStore usando Zustand.
 * Esta clase actúa como un adaptador entre la interfaz IAuthStore
 * y la implementación específica de Zustand.
 */
@injectable()
export class ZustandAuthStore implements IAuthStore {
  getToken(): string | null {
    return useAuthStore.getState().token;
  }

  getUser(): User | null {
    return useAuthStore.getState().user;
  }

  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  }

  setAuth(user: User, token: string): void {
    useAuthStore.getState().setAuth(user, token);
  }

  clearAuth(): void {
    useAuthStore.getState().clearAuth();
    
    // Redirigir al login solo si estamos en el cliente y no estamos ya en login
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login?expired=true';
    }
  }
}

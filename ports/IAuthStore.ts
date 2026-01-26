import { User } from '../domain/entities/User';

/**
 * Interfaz que abstrae el acceso al store de autenticación.
 * Permite desacoplar AxiosApiClient de la implementación específica de Zustand.
 */
export interface IAuthStore {
  /**
   * Obtiene el token de autenticación actual
   */
  getToken(): string | null;

  /**
   * Obtiene el usuario autenticado actual
   */
  getUser(): User | null;

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean;

  /**
   * Establece la autenticación del usuario
   */
  setAuth(user: User, token: string): void;

  /**
   * Limpia la autenticación y redirige al login si es necesario
   */
  clearAuth(): void;
}

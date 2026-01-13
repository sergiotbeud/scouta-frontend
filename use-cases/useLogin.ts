import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useAuthStore } from '../store/auth-store';
import { User, UserRole } from '../domain/entities/User';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

interface UseLoginReturn {
  login: (email: string, password: string) => Promise<{ mustChangePassword: boolean } | null>;
  isLoading: boolean;
  error: string | null;
}

export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const login = async (email: string, password: string): Promise<{ mustChangePassword: boolean } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.login({ email, password });

      if (response.success && response.data) {
        const user: User = {
          ...response.data.user,
          role: response.data.user.role as UserRole,
        };
        apiClient.setToken(response.data.token);
        setAuth(user, response.data.token);

        const mustChangePassword = response.data.mustChangePassword || false;

        if (!mustChangePassword) {
          router.push('/dashboard');
        }

        return { mustChangePassword };
      } else {
        setError(response.error || 'Error al iniciar sesión');
        return null;
      }
    } catch (err: any) {
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:3000');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}


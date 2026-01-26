import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthClient } from '../hooks/useAuthClient';
import { useApiClient } from '../hooks/useApiClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useAuthStore } from '../store/auth-store';
import { User, UserRole } from '../domain/entities/User';

interface UseLoginReturn {
  login: (email: string, password: string) => Promise<{ mustChangePassword: boolean; mustChangeEmail: boolean } | null>;
  isLoading: boolean;
  error: string | null;
}

export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const authClient = useAuthClient();
  const apiClient = useApiClient(); // Necesario para setToken
  const { handleError } = useErrorHandler();

  const login = async (email: string, password: string): Promise<{ mustChangePassword: boolean; mustChangeEmail: boolean } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authClient.login({ email, password });

      if (response.success && response.data) {
        const user: User = {
          ...response.data.user,
          role: response.data.user.role as UserRole,
          mustChangePassword: response.data.mustChangePassword || false,
        };
        apiClient.setToken(response.data.token);
        setAuth(user, response.data.token);

        const mustChangePassword = response.data.mustChangePassword || false;
        const mustChangeEmail = response.data.mustChangeEmail || false;

        if (!mustChangePassword && !mustChangeEmail) {
          router.push('/dashboard');
        }

        return { mustChangePassword, mustChangeEmail };
      } else {
        setError(response.error || 'Error al iniciar sesión');
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al iniciar sesión');
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthClient } from '../hooks/useAuthClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useAuthStore } from '../store/auth-store';
import { User } from '../domain/entities/User';

interface UseChangePasswordReturn {
  changePassword: (currentPassword: string | undefined, newPassword: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useChangePassword(): UseChangePasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const authClient = useAuthClient();
  const { handleError } = useErrorHandler();

  const changePassword = async (currentPassword: string | undefined, newPassword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authClient.changePassword({
        currentPassword,
        newPassword,
      });

      if (response.success) {
        // Actualizar el estado del usuario para reflejar que mustChangePassword es false
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          const updatedUser: User = {
            ...currentUser,
            mustChangePassword: false,
          };
          useAuthStore.getState().setAuth(updatedUser, token || '');
        }
        router.push('/dashboard');
      } else {
        setError(response.error || 'Error al cambiar la contraseña');
        throw new Error(response.error || 'Error al cambiar la contraseña');
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al cambiar la contraseña');
      setError(errorMessage);
      throw err; // Re-lanzar el error para que el componente pueda manejarlo
    } finally {
      setIsLoading(false);
    }
  };

  return { changePassword, isLoading, error };
}


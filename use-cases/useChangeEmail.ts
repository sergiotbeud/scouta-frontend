import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthClient } from '../hooks/useAuthClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useAuthStore } from '../store/auth-store';
import { User } from '../domain/entities/User';

interface UseChangeEmailReturn {
  changeEmail: (newEmail: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useChangeEmail(): UseChangeEmailReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const authClient = useAuthClient();
  const { handleError } = useErrorHandler();

  const changeEmail = async (newEmail: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authClient.changeEmail({
        newEmail,
      });

      if (response.success) {
        // Actualizar el email del usuario en el store
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          const updatedUser: User = {
            ...currentUser,
            email: newEmail.trim().toLowerCase(),
          };
          setAuth(updatedUser, token || '');
        }
        return true;
      } else {
        setError(response.error || 'Error al cambiar el email');
        throw new Error(response.error || 'Error al cambiar el email');
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al cambiar el email');
      setError(errorMessage);
      throw err; // Re-lanzar el error para que el componente pueda manejarlo
    } finally {
      setIsLoading(false);
    }
  };

  return { changeEmail, isLoading, error };
}


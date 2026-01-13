import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useAuthStore } from '../store/auth-store';
import { User } from '../domain/entities/User';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

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

  const changeEmail = async (newEmail: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      if (token) {
        apiClient.setToken(token);
      }

      const response = await apiClient.changeEmail({
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
    } catch (err: any) {
      let errorMessage = 'Error al conectar con el servidor';
      if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      throw err; // Re-lanzar el error para que el componente pueda manejarlo
    } finally {
      setIsLoading(false);
    }
  };

  return { changeEmail, isLoading, error };
}


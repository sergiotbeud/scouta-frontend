import { useState } from 'react';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth-store';
import { User } from '../domain/entities/User';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

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

  const changePassword = async (currentPassword: string | undefined, newPassword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (token) {
        apiClient.setToken(token);
      }

      const response = await apiClient.changePassword({
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

  return { changePassword, isLoading, error };
}


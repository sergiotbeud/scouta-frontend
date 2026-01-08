import { useState, useEffect } from 'react';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { Club } from '../ports/IApiClient';
import { useAuthStore } from '../store/auth-store';
import { UserRole } from '../domain/entities/User';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export function useMyClub() {
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchMyClub = async () => {
      if (!token || !user) {
        setIsLoading(false);
        return;
      }

      // Solo obtener club si el usuario no es SUPER_ADMIN
      if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.PLAYER) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        apiClient.setToken(token);
        const response = await apiClient.getMyClubs();
        
        if (response.success && response.data && response.data.length > 0) {
          // Si tiene múltiples clubes, tomar el primero (o el principal si está definido)
          // Por ahora, tomamos el primero
          setClub(response.data[0]);
        } else {
          setClub(null);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar información del club');
        setClub(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyClub();
  }, [token, user]);

  return { club, isLoading, error };
}



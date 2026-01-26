import { useState, useEffect } from 'react';
import { useClubClient } from '../hooks/useClubClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Club } from '../ports/IApiClient';
import { useAuthStore } from '../store/auth-store';
import { UserRole } from '../domain/entities/User';

export function useMyClub() {
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clubClient = useClubClient();
  const { handleError } = useErrorHandler();

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
        const response = await clubClient.getMyClubs();
        
        if (response.success && response.data && response.data.length > 0) {
          // Si tiene múltiples clubes, tomar el primero (o el principal si está definido)
          // Por ahora, tomamos el primero
          setClub(response.data[0]);
        } else {
          setClub(null);
        }
      } catch (err: unknown) {
        const errorMessage = handleError(err, 'Error al cargar información del club');
        setError(errorMessage);
        setClub(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyClub();
  }, [token, user]);

  return { club, isLoading, error };
}



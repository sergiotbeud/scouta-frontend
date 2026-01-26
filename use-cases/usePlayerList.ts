import { useState } from 'react';
import { usePlayerClient } from '../hooks/usePlayerClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Player } from '../domain/entities/Player';
import { GetPlayersFilters } from '../ports/IApiClient';

/**
 * Hook para obtener y gestionar la lista de jugadores
 */
export function usePlayerList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerClient = usePlayerClient();
  const { handleError } = useErrorHandler();

  const fetchPlayers = async (filters?: GetPlayersFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await playerClient.getPlayers(filters);
      if (response.success && response.data) {
        setPlayers(response.data);
      } else {
        const errorMessage = response.error || 'Error al cargar jugadores';
        setError(errorMessage);
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error en fetchPlayers:', response);
        }
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al cargar jugadores');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeletedPlayers = async (): Promise<Player[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await playerClient.getDeletedPlayers();
      if (response.success && response.data) {
        return response.data;
      } else {
        const errorMessage = response.error || 'Error al cargar jugadores eliminados';
        setError(errorMessage);
        return [];
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al cargar jugadores eliminados');
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    players,
    isLoading,
    error,
    fetchPlayers,
    fetchDeletedPlayers,
    setPlayers,
  };
}

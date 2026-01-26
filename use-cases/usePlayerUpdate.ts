import { useState } from 'react';
import { usePlayerClient } from '../hooks/usePlayerClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Player } from '../domain/entities/Player';
import { UpdatePlayerRequest } from '../ports/IApiClient';

/**
 * Hook para actualizar un jugador existente
 */
export function usePlayerUpdate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerClient = usePlayerClient();
  const { handleError } = useErrorHandler();

  const updatePlayer = async (id: string, playerData: UpdatePlayerRequest): Promise<Player | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await playerClient.updatePlayer(id, playerData);
      if (response.success && response.data) {
        return response.data;
      } else {
        const errorMessage = response.error || 'Error al actualizar jugador';
        setError(errorMessage);
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al actualizar jugador');
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updatePlayer,
    isLoading,
    error,
  };
}

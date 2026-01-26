import { useState } from 'react';
import { usePlayerClient } from '../hooks/usePlayerClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Player } from '../domain/entities/Player';
import { CreatePlayerRequest } from '../ports/IApiClient';

/**
 * Hook para crear un nuevo jugador
 */
export function usePlayerCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerClient = usePlayerClient();
  const { handleError } = useErrorHandler();

  const createPlayer = async (playerData: CreatePlayerRequest): Promise<Player | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await playerClient.createPlayer(playerData);
      if (response.success && response.data) {
        return response.data;
      } else {
        const errorMessage = response.error || 'Error al crear jugador';
        setError(errorMessage);
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error en createPlayer:', response);
        }
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al crear jugador');
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPlayer,
    isLoading,
    error,
  };
}

import { useState } from 'react';
import { usePlayerClient } from '../hooks/usePlayerClient';
import { useErrorHandler } from '../hooks/useErrorHandler';

/**
 * Hook para eliminar y restaurar jugadores
 */
export function usePlayerDelete() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerClient = usePlayerClient();
  const { handleError } = useErrorHandler();

  const deletePlayer = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await playerClient.deletePlayer(id);
      if (response.success) {
        return true;
      } else {
        const errorMessage = response.error || 'Error al eliminar jugador';
        setError(errorMessage);
        return false;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al eliminar jugador');
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePlayer = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await playerClient.restorePlayer(id);
      if (response.success) {
        return true;
      } else {
        const errorMessage = response.error || 'Error al restaurar jugador';
        setError(errorMessage);
        return false;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al restaurar jugador');
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deletePlayer,
    restorePlayer,
    isLoading,
    error,
  };
}

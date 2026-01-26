import { useState } from 'react';
import { usePlayerClient } from '../hooks/usePlayerClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Player } from '../domain/entities/Player';
import { CreatePlayerRequest, UpdatePlayerRequest, GetPlayersFilters } from '../ports/IApiClient';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerClient = usePlayerClient();
  const { handleError } = useErrorHandler();

  const fetchPlayers = async (filters?: GetPlayersFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      // El token se configura automáticamente en usePlayerClient
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

  const createPlayer = async (playerData: CreatePlayerRequest): Promise<Player | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await playerClient.createPlayer(playerData);
      if (response.success && response.data) {
        await fetchPlayers();
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

  const updatePlayer = async (id: string, playerData: UpdatePlayerRequest): Promise<Player | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await playerClient.updatePlayer(id, playerData);
      if (response.success && response.data) {
        await fetchPlayers();
        return response.data;
      } else {
        setError(response.error || 'Error al actualizar jugador');
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

  const deletePlayer = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await playerClient.deletePlayer(id);
      if (response.success) {
        await fetchPlayers();
        return true;
      } else {
        setError(response.error || 'Error al eliminar jugador');
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

  const fetchDeletedPlayers = async () => {
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

  const restorePlayer = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await playerClient.restorePlayer(id);
      if (response.success) {
        await fetchPlayers();
        return true;
      } else {
        setError(response.error || 'Error al restaurar jugador');
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
    players,
    isLoading,
    error,
    fetchPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
    fetchDeletedPlayers,
    restorePlayer,
  };
}


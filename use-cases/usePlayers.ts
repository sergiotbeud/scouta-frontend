import { useState, useEffect } from 'react';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useAuthStore } from '../store/auth-store';
import { Player } from '../domain/entities/Player';
import { CreatePlayerRequest, UpdatePlayerRequest, GetPlayersFilters } from '../ports/IApiClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
  }, [token]);

  const fetchPlayers = async (filters?: GetPlayersFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      // Asegurar que el token esté configurado antes de hacer la petición
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.getPlayers(filters);
      if (response.success && response.data) {
        setPlayers(response.data);
      } else {
        const errorMessage = response.error || 'Error al cargar jugadores';
        setError(errorMessage);
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error en fetchPlayers:', response);
        }
      }
    } catch (err: any) {
      let errorMessage = 'Error al cargar jugadores';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:3000';
      }
      
      setError(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error en fetchPlayers (catch):', {
          message: err.message,
          response: err.response?.data,
          request: err.request,
          error: err
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createPlayer = async (playerData: CreatePlayerRequest): Promise<Player | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.createPlayer(playerData);
      if (response.success && response.data) {
        await fetchPlayers();
        return response.data;
      } else {
        // Extraer detalles de validación si existen
        let errorMessage = response.error || 'Error al crear jugador';
        if (response.details && Array.isArray(response.details)) {
          const validationErrors = response.details.map((detail: any) => 
            `${detail.path?.join('.') || 'campo'}: ${detail.message}`
          ).join(', ');
          errorMessage = `Error de validación: ${validationErrors}`;
        }
        setError(errorMessage);
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error en createPlayer:', response);
        }
        return null;
      }
    } catch (err: any) {
      let errorMessage = 'Error al crear jugador';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
        if (err.response.data.details && Array.isArray(err.response.data.details)) {
          const validationErrors = err.response.data.details.map((detail: any) => 
            `${detail.path?.join('.') || 'campo'}: ${detail.message}`
          ).join(', ');
          errorMessage = `Error de validación: ${validationErrors}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error en createPlayer (catch):', {
          message: err.message,
          response: err.response?.data,
          error: err
        });
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlayer = async (id: string, playerData: UpdatePlayerRequest): Promise<Player | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.updatePlayer(id, playerData);
      if (response.success && response.data) {
        await fetchPlayers();
        return response.data;
      } else {
        setError(response.error || 'Error al actualizar jugador');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar jugador');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlayer = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.deletePlayer(id);
      if (response.success) {
        await fetchPlayers();
        return true;
      } else {
        setError(response.error || 'Error al eliminar jugador');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar jugador');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeletedPlayers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.getDeletedPlayers();
      if (response.success && response.data) {
        return response.data;
      } else {
        const errorMessage = response.error || 'Error al cargar jugadores eliminados';
        setError(errorMessage);
        return [];
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar jugadores eliminados';
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
      const response = await apiClient.restorePlayer(id);
      if (response.success) {
        await fetchPlayers();
        return true;
      } else {
        setError(response.error || 'Error al restaurar jugador');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Error al restaurar jugador');
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


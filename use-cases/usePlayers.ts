/**
 * @deprecated Este hook está siendo reemplazado por hooks más específicos:
 * - usePlayerList: Para obtener y gestionar la lista de jugadores
 * - usePlayerCreate: Para crear nuevos jugadores
 * - usePlayerUpdate: Para actualizar jugadores existentes
 * - usePlayerDelete: Para eliminar y restaurar jugadores
 * 
 * Este hook se mantiene por compatibilidad hacia atrás, pero se recomienda
 * usar los hooks específicos para mejor separación de responsabilidades.
 */

import { usePlayerList } from './usePlayerList';
import { usePlayerCreate } from './usePlayerCreate';
import { usePlayerUpdate } from './usePlayerUpdate';
import { usePlayerDelete } from './usePlayerDelete';
import { CreatePlayerRequest, UpdatePlayerRequest, GetPlayersFilters } from '../ports/IApiClient';
import { Player } from '../domain/entities/Player';

/**
 * Hook combinado que proporciona todas las funcionalidades de gestión de jugadores.
 * Combina usePlayerList, usePlayerCreate, usePlayerUpdate y usePlayerDelete.
 */
export function usePlayers() {
  const playerList = usePlayerList();
  const playerCreate = usePlayerCreate();
  const playerUpdate = usePlayerUpdate();
  const playerDelete = usePlayerDelete();

  // Wrapper para createPlayer que actualiza la lista después de crear
  const createPlayer = async (playerData: CreatePlayerRequest): Promise<Player | null> => {
    const result = await playerCreate.createPlayer(playerData);
    if (result) {
      await playerList.fetchPlayers();
    }
    return result;
  };

  // Wrapper para updatePlayer que actualiza la lista después de actualizar
  const updatePlayer = async (id: string, playerData: UpdatePlayerRequest): Promise<Player | null> => {
    const result = await playerUpdate.updatePlayer(id, playerData);
    if (result) {
      await playerList.fetchPlayers();
    }
    return result;
  };

  // Wrapper para deletePlayer que actualiza la lista después de eliminar
  const deletePlayer = async (id: string): Promise<boolean> => {
    const result = await playerDelete.deletePlayer(id);
    if (result) {
      await playerList.fetchPlayers();
    }
    return result;
  };

  // Wrapper para restorePlayer que actualiza la lista después de restaurar
  const restorePlayer = async (id: string): Promise<boolean> => {
    const result = await playerDelete.restorePlayer(id);
    if (result) {
      await playerList.fetchPlayers();
    }
    return result;
  };

  return {
    players: playerList.players,
    isLoading: playerList.isLoading || playerCreate.isLoading || playerUpdate.isLoading || playerDelete.isLoading,
    error: playerList.error || playerCreate.error || playerUpdate.error || playerDelete.error,
    fetchPlayers: playerList.fetchPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
    fetchDeletedPlayers: playerList.fetchDeletedPlayers,
    restorePlayer,
  };
}


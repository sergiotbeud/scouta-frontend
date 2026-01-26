import { Player, CreatePlayerRequest, UpdatePlayerRequest, GetPlayersFilters, ApiResponse, UploadPhotoResponse } from './IApiClient';

/**
 * Interfaz para operaciones relacionadas con jugadores
 */
export interface IPlayerClient {
  getPlayers(filters?: GetPlayersFilters): Promise<ApiResponse<Player[]>>;
  getDeletedPlayers(): Promise<ApiResponse<Player[]>>;
  getPlayerById(id: string, includeDeleted?: boolean): Promise<ApiResponse<Player>>;
  createPlayer(player: CreatePlayerRequest): Promise<ApiResponse<Player>>;
  updatePlayer(id: string, player: UpdatePlayerRequest): Promise<ApiResponse<Player>>;
  deletePlayer(id: string): Promise<ApiResponse<void>>;
  restorePlayer(id: string): Promise<ApiResponse<void>>;
  uploadPlayerPhoto(file: File): Promise<ApiResponse<UploadPhotoResponse>>;
}

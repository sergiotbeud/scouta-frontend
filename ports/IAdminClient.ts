import { PlayerWithoutPassword, GeneratePasswordResponse, DashboardStats, PlayerStats, ApiResponse } from './IApiClient';

/**
 * Interfaz para operaciones de administración (solo SUPER_ADMIN)
 */
export interface IAdminClient {
  getPlayersWithoutPassword(): Promise<ApiResponse<PlayerWithoutPassword[]>>;
  generatePlayerPassword(playerId: string): Promise<ApiResponse<GeneratePasswordResponse>>;
  getDashboardStats(): Promise<ApiResponse<DashboardStats | PlayerStats>>;
}

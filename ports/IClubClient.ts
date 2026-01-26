import { Club, CreateClubRequest, UpdateClubRequest, ApiResponse } from './IApiClient';

/**
 * Interfaz para operaciones relacionadas con clubes
 */
export interface IClubClient {
  getClubs(): Promise<ApiResponse<Club[]>>;
  getClubById(id: string): Promise<ApiResponse<Club>>;
  getMyClubs(): Promise<ApiResponse<Club[]>>;
  createClub(club: CreateClubRequest): Promise<ApiResponse<Club>>;
  updateClub(id: string, club: UpdateClubRequest): Promise<ApiResponse<Club>>;
  deleteClub(id: string): Promise<ApiResponse<void>>;
}

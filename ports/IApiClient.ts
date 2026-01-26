import { Player } from '../domain/entities/Player';
import { Evaluation } from '../domain/entities/Evaluation';
import { EvaluationTemplate, CreateEvaluationTemplateRequest, UpdateEvaluationTemplateRequest } from '../domain/entities/EvaluationTemplate';
import { IAuthClient } from './IAuthClient';
import { IPlayerClient } from './IPlayerClient';
import { IEvaluationClient } from './IEvaluationClient';
import { IClubClient } from './IClubClient';
import { ISubscriptionClient } from './ISubscriptionClient';
import { IReportClient } from './IReportClient';
import { IEvaluatorClient } from './IEvaluatorClient';
import { IAdminClient } from './IAdminClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      photoUrl: string | null;
      role: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
    token: string;
    mustChangePassword: boolean;
    mustChangeEmail: boolean; // Nuevo: indica si el email es generado
  };
  error?: string;
  details?: unknown;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  data?: {
    message: string;
  };
  error?: string;
  details?: unknown;
}

export interface ChangeEmailResponse {
  success: boolean;
  data?: {
    message: string;
  };
  error?: string;
  details?: unknown;
}

export interface CreatePlayerRequest {
  name: string;
  positions: string[]; // Array de posiciones
  age: number;
  password: string; // Contraseña obligatoria para el jugador
  userId?: string | null;
  photoUrl?: string | null;
  height?: number | null;
  weight?: number | null;
  biometricData?: Record<string, any> | null;
  contactInfo?: Record<string, any> | null;
  phone?: string | null;
  email?: string | null;
  eps?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
}

export interface UpdatePlayerRequest {
  name?: string;
  positions?: string[]; // Array de posiciones
  age?: number;
  userId?: string | null;
  photoUrl?: string | null;
  height?: number | null;
  weight?: number | null;
  biometricData?: Record<string, any> | null;
  contactInfo?: Record<string, any> | null;
  phone?: string | null;
  email?: string | null;
  eps?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface GetPlayersFilters {
  search?: string;
  positions?: string[];
  minAge?: number;
  maxAge?: number;
  sortBy?: 'name' | 'age' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export interface UploadPhotoResponse {
  photoUrl: string;
  filename: string;
}

export interface CreateEvaluationRequest {
  playerId: string;
  evaluatorId: string;
  date?: string;
  observations?: string | null;
  items: Array<{
    category: string;
    itemName: string;
    value: any;
    dataType: string;
  }>;
  strengths?: string[];
  weaknesses?: string[];
}

export interface UpdateEvaluationRequest {
  playerId?: string;
  evaluatorId?: string;
  date?: string;
  observations?: string | null;
  items?: Array<{
    category: string;
    itemName: string;
    value: any;
    dataType: string;
  }>;
  strengths?: string[];
  weaknesses?: string[];
}

export interface GetEvaluationsFilters {
  playerId?: string;
  evaluatorId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'createdAt' | 'generalScore';
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardStats {
  totalPlayers: number;
  activePlayers: number;
  totalEvaluations: number;
  evaluationsThisMonth: number;
  averageGeneralScore: number | null;
  evaluatedPlayers: number;
  playersByPosition: Record<string, number>;
  evaluationsByMonth: Array<{ month: string; count: number }>;
}

export interface PlayerStats {
  totalEvaluations: number;
  lastEvaluationDate: string | null;
  lastEvaluationScore: number | null;
  averageGeneralScore: number | null;
  evaluationsThisMonth: number;
  scoreEvolution: Array<{ date: string; score: number }>;
  evaluationsByCategory: Record<string, { average: number; count: number }>;
}

export interface Club {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role?: string; // Rol del usuario en el club (ADMIN, EVALUATOR)
}

export interface CreateClubRequest {
  name: string;
  logoUrl?: string | null;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

export interface UpdateClubRequest {
  name?: string;
  logoUrl?: string | null;
  isActive?: boolean;
}

export interface Subscription {
  id: string;
  clubId: string;
  planType: 'FOUNDER' | 'STANDARD';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'GRACE_PERIOD';
  startDate: string;
  endDate?: string | null;
  lastPaymentDate?: string | null;
  nextPaymentDate?: string | null;
  maxPlayers: number;
  maxEvaluators: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSubscriptionRequest {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'GRACE_PERIOD';
  planType?: 'FOUNDER' | 'STANDARD';
  maxPlayers?: number;
  maxEvaluators?: number;
  endDate?: string | null;
}

import { IAuthClient } from './IAuthClient';
import { IPlayerClient } from './IPlayerClient';
import { IEvaluationClient } from './IEvaluationClient';
import { IClubClient } from './IClubClient';
import { ISubscriptionClient } from './ISubscriptionClient';
import { IReportClient } from './IReportClient';
import { IEvaluatorClient } from './IEvaluatorClient';
import { IAdminClient } from './IAdminClient';

/**
 * Interfaz principal que agrupa todas las interfaces de cliente API.
 * Mantiene compatibilidad hacia atrás mientras permite usar interfaces más específicas.
 */
export interface IApiClient extends IAuthClient, IPlayerClient, IEvaluationClient, IClubClient, ISubscriptionClient, IReportClient, IEvaluatorClient, IAdminClient {
  setToken(token: string | null): void;
  uploadClubLogo(file: File): Promise<ApiResponse<UploadPhotoResponse>>;
  uploadUserPhoto(file: File): Promise<ApiResponse<UploadPhotoResponse>>;
}

export interface CreateSubscriptionRequest {
  planType?: 'FOUNDER' | 'STANDARD';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'GRACE_PERIOD';
  maxPlayers?: number;
  maxEvaluators?: number;
  endDate?: string | null;
}

export interface PlayerWithoutPassword {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  clubId: string;
  clubName: string;
  userId: string | null;
  hasPassword: boolean;
  mustChangePassword: boolean;
}

export interface GeneratePasswordResponse {
  playerId: string;
  playerName: string;
  email: string;
  generatedPassword: string; // Solo se muestra una vez
  userId: string;
  clubName: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl: string | null;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluatorRequest {
  name: string;
  email: string;
  password: string;
  photoUrl?: string | null;
  clubId: string;
}

export interface UpdateEvaluatorRequest {
  name?: string;
  email?: string;
  password?: string;
  photoUrl?: string | null;
  isActive?: boolean;
}

export interface SharedReport {
  id: string;
  token: string;
  evaluationId: string;
  createdBy: string;
  expiresAt?: string | null;
  maxViews?: number | null;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shareUrl?: string;
}

export interface SharedReportInfo {
  token: string;
  viewCount: number;
  maxViews?: number | null;
  expiresAt?: string | null;
}


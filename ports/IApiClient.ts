import { Player } from '../domain/entities/Player';
import { Evaluation } from '../domain/entities/Evaluation';
import { EvaluationTemplate, CreateEvaluationTemplateRequest, UpdateEvaluationTemplateRequest } from '../domain/entities/EvaluationTemplate';

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
  };
  error?: string;
  details?: unknown;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
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

export interface IApiClient {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse>;
  getPlayers(filters?: GetPlayersFilters): Promise<ApiResponse<Player[]>>;
  getDeletedPlayers(): Promise<ApiResponse<Player[]>>;
  getPlayerById(id: string, includeDeleted?: boolean): Promise<ApiResponse<Player>>;
  createPlayer(player: CreatePlayerRequest): Promise<ApiResponse<Player>>;
  updatePlayer(id: string, player: UpdatePlayerRequest): Promise<ApiResponse<Player>>;
  deletePlayer(id: string): Promise<ApiResponse<void>>;
  restorePlayer(id: string): Promise<ApiResponse<void>>;
  uploadPlayerPhoto(file: File): Promise<ApiResponse<UploadPhotoResponse>>;
  uploadClubLogo(file: File): Promise<ApiResponse<UploadPhotoResponse>>;
  uploadUserPhoto(file: File): Promise<ApiResponse<UploadPhotoResponse>>;
  // Evaluations
  createEvaluation(evaluation: CreateEvaluationRequest): Promise<ApiResponse<Evaluation>>;
  getEvaluations(filters?: GetEvaluationsFilters): Promise<ApiResponse<Evaluation[]>>;
  getEvaluationById(id: string): Promise<ApiResponse<Evaluation>>;
  getPlayerEvaluations(playerId: string, filters?: Omit<GetEvaluationsFilters, 'playerId'>): Promise<ApiResponse<Evaluation[]>>;
  updateEvaluation(id: string, evaluation: UpdateEvaluationRequest): Promise<ApiResponse<Evaluation>>;
  deleteEvaluation(id: string): Promise<ApiResponse<void>>;
  // Evaluation Templates
  createEvaluationTemplate(template: CreateEvaluationTemplateRequest): Promise<ApiResponse<EvaluationTemplate>>;
  getEvaluationTemplates(position?: string): Promise<ApiResponse<EvaluationTemplate[]>>;
  getEvaluationTemplateById(id: string): Promise<ApiResponse<EvaluationTemplate>>;
  updateEvaluationTemplate(id: string, template: UpdateEvaluationTemplateRequest): Promise<ApiResponse<EvaluationTemplate>>;
  deleteEvaluationTemplate(id: string): Promise<ApiResponse<void>>;
  // Dashboard
  getDashboardStats(): Promise<ApiResponse<DashboardStats | PlayerStats>>;
  // Clubs (solo SUPER_ADMIN)
  getClubs(): Promise<ApiResponse<Club[]>>;
  getClubById(id: string): Promise<ApiResponse<Club>>;
  getMyClubs(): Promise<ApiResponse<Club[]>>; // Obtener clubes del usuario actual
  createClub(club: CreateClubRequest): Promise<ApiResponse<Club>>;
  updateClub(id: string, club: UpdateClubRequest): Promise<ApiResponse<Club>>;
  deleteClub(id: string): Promise<ApiResponse<void>>;
  // Subscriptions
  getSubscriptionByClubId(clubId: string): Promise<ApiResponse<Subscription>>;
  getMySubscription(): Promise<ApiResponse<Subscription>>; // Para ADMIN obtener su propia suscripción
  createSubscription(clubId: string, subscription: CreateSubscriptionRequest): Promise<ApiResponse<Subscription>>;
  updateSubscription(clubId: string, subscription: UpdateSubscriptionRequest): Promise<ApiResponse<Subscription>>;
  // Evaluators (solo ADMIN)
  getEvaluators(): Promise<ApiResponse<User[]>>;
  getEvaluatorById(id: string): Promise<ApiResponse<User>>;
  createEvaluator(evaluator: CreateEvaluatorRequest): Promise<ApiResponse<User>>;
  updateEvaluator(id: string, evaluator: UpdateEvaluatorRequest): Promise<ApiResponse<User>>;
  deleteEvaluator(id: string): Promise<ApiResponse<void>>;
  // Reports
  generateEvaluationPDF(evaluationId: string): Promise<{ blob: Blob; filename: string }>;
  createSharedReport(evaluationId: string, options?: { expiresInDays?: number; maxViews?: number }): Promise<ApiResponse<SharedReport>>;
  getSharedReport(token: string): Promise<ApiResponse<{ evaluation: Evaluation; player?: Player | null; evaluator?: User | null; club?: Club | null; sharedReport: SharedReportInfo }>>;
  generateSharedReportPDF(token: string): Promise<{ blob: Blob; filename: string }>;
}

export interface CreateSubscriptionRequest {
  planType?: 'FOUNDER' | 'STANDARD';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'GRACE_PERIOD';
  maxPlayers?: number;
  maxEvaluators?: number;
  endDate?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl: string | null;
  role: string;
  isActive: boolean;
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


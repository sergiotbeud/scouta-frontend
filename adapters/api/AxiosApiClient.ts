import 'reflect-metadata';
import { injectable } from 'tsyringe';
import axios, { AxiosInstance } from 'axios';
import { 
  IApiClient, 
  LoginRequest, 
  LoginResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ChangeEmailRequest,
  ChangeEmailResponse,
  CreatePlayerRequest, 
  UpdatePlayerRequest,
  ApiResponse,
  GetPlayersFilters,
  CreateEvaluationRequest,
  UpdateEvaluationRequest,
  GetEvaluationsFilters,
  UploadPhotoResponse,
  DashboardStats,
  PlayerStats,
  Club,
  CreateClubRequest,
  UpdateClubRequest,
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SharedReport,
  SharedReportInfo,
  CreateEvaluatorRequest,
  UpdateEvaluatorRequest,
  PlayerWithoutPassword,
  GeneratePasswordResponse,
} from '../../ports/IApiClient';
import { IAuthClient } from '../../ports/IAuthClient';
import { IPlayerClient } from '../../ports/IPlayerClient';
import { IEvaluationClient } from '../../ports/IEvaluationClient';
import { IClubClient } from '../../ports/IClubClient';
import { ISubscriptionClient } from '../../ports/ISubscriptionClient';
import { IReportClient } from '../../ports/IReportClient';
import { IEvaluatorClient } from '../../ports/IEvaluatorClient';
import { IAdminClient } from '../../ports/IAdminClient';
import { isAxiosError } from '../../utils/typeGuards';
import { Player } from '../../domain/entities/Player';
import { Evaluation } from '../../domain/entities/Evaluation';
import { EvaluationTemplate, CreateEvaluationTemplateRequest, UpdateEvaluationTemplateRequest } from '../../domain/entities/EvaluationTemplate';
import { User } from '../../ports/IApiClient';
import { safeValidateApiResponse } from '../../schemas/apiResponses';
import {
  ApiResponsePlayerSchema,
  ApiResponsePlayersSchema,
  ApiResponseUserSchema,
  ApiResponseUsersSchema,
  ApiResponseEvaluationSchema,
  ApiResponseEvaluationsSchema,
  ApiResponseClubSchema,
  ApiResponseClubsSchema,
  ApiResponseSubscriptionSchema,
  ApiResponseUploadPhotoSchema,
  ApiResponseDashboardStatsSchema,
  ApiResponsePlayerStatsSchema,
  ApiResponseSharedReportSchema,
  ApiResponsePlayerWithoutPasswordSchema,
  ApiResponseGeneratePasswordSchema,
  LoginResponseSchema,
  ChangePasswordResponseSchema,
  ChangeEmailResponseSchema,
} from '../../schemas/apiResponses';

@injectable()
export class AxiosApiClient implements IApiClient, IAuthClient, IPlayerClient, IEvaluationClient, IClubClient, ISubscriptionClient, IReportClient, IEvaluatorClient, IAdminClient {
  private client: AxiosInstance;
  private token: string | null = null;

  /**
   * Helper para manejar errores de Axios y retornar la respuesta del error si existe
   */
  private handleAxiosError<T>(error: unknown, methodName?: string): ApiResponse<T> {
    if (isAxiosError(error)) {
      // Log en desarrollo
      if (process.env.NODE_ENV === 'development' && methodName) {
        console.error(`❌ Error en ${methodName}:`, {
          message: error.message,
          hasResponse: !!error.response,
          hasRequest: !!error.request,
          responseData: error.response?.data,
          baseURL: this.client.defaults.baseURL,
        });
      }

      // Si hay respuesta del servidor, retornarla
      if (error.response?.data) {
        return error.response.data as ApiResponse<T>;
      }

      // Si hay request pero no response, es error de conexión
      if (error.request && !error.response) {
        throw new Error(`No se pudo conectar con el servidor en ${this.client.defaults.baseURL}. Verifica que el backend esté corriendo.`);
      }
    }

    // Si es un Error estándar, crear respuesta de error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return {
      success: false,
      error: errorMessage,
    };
  }

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token a las peticiones
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Interceptor para manejar errores 401 (token expirado)
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido - limpiar token
          // El manejo de la redirección al login se hace en los hooks/componentes que usan el cliente
          this.token = null;
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>(
        '/api/auth/login',
        credentials
      );
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, LoginResponseSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de login no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<LoginResponse['data']>(error, 'login');
    }
  }

  async changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      const response = await this.client.post<ChangePasswordResponse>(
        '/api/auth/change-password',
        request
      );
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ChangePasswordResponseSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de changePassword no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<ChangePasswordResponse['data']>(error, 'changePassword');
    }
  }

  async changeEmail(request: ChangeEmailRequest): Promise<ChangeEmailResponse> {
    try {
      const response = await this.client.post<ChangeEmailResponse>(
        '/api/auth/change-email',
        request
      );
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ChangeEmailResponseSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de changeEmail no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<ChangeEmailResponse['data']>(error, 'changeEmail');
    }
  }

  async getPlayers(filters?: GetPlayersFilters): Promise<ApiResponse<Player[]>> {
    try {
      // Construir query string desde los filtros
      const params = new URLSearchParams();
      
      if (filters?.search) {
        params.append('search', filters.search);
      }
      
      if (filters?.positions && filters.positions.length > 0) {
        filters.positions.forEach(pos => params.append('positions[]', pos));
      }
      
      if (filters?.minAge !== undefined) {
        params.append('minAge', filters.minAge.toString());
      }
      
      if (filters?.maxAge !== undefined) {
        params.append('maxAge', filters.maxAge.toString());
      }
      
      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      
      if (filters?.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }
      
      if (filters?.includeDeleted) {
        params.append('includeDeleted', 'true');
      }

      const queryString = params.toString();
      const url = `/api/players${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.client.get<ApiResponse<Player[]>>(url);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<Player[]>(error, 'getPlayers');
    }
  }

  async getPlayerById(id: string, includeDeleted: boolean = false): Promise<ApiResponse<Player>> {
    try {
      const params = includeDeleted ? '?includeDeleted=true' : '';
      const response = await this.client.get<ApiResponse<Player>>(`/api/players/${id}${params}`);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<Player>(error, 'getPlayerById');
    }
  }

  async createPlayer(player: CreatePlayerRequest): Promise<ApiResponse<Player>> {
    try {
      const response = await this.client.post<ApiResponse<Player>>('/api/players', player);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponsePlayerSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de createPlayer no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<Player>(error, 'createPlayer');
    }
  }

  async updatePlayer(id: string, player: UpdatePlayerRequest): Promise<ApiResponse<Player>> {
    try {
      const response = await this.client.put<ApiResponse<Player>>(`/api/players/${id}`, player);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<Player>(error, 'updatePlayer');
    }
  }

  async deletePlayer(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/api/players/${id}`);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<void>(error, 'deletePlayer');
    }
  }

  async getDeletedPlayers(): Promise<ApiResponse<Player[]>> {
    try {
      const response = await this.client.get<ApiResponse<Player[]>>('/api/players/deleted');
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponsePlayersSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de getDeletedPlayers no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<Player[]>(error, 'getDeletedPlayers');
    }
  }

  async restorePlayer(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.post<ApiResponse<void>>(`/api/players/${id}/restore`);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<void>(error, 'restorePlayer');
    }
  }

  async uploadPlayerPhoto(file: File): Promise<ApiResponse<UploadPhotoResponse>> {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await this.client.post<ApiResponse<UploadPhotoResponse>>(
        '/api/player-photos/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 segundos para conversión HEIC
        }
      );
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseUploadPhotoSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de uploadPlayerPhoto no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<UploadPhotoResponse>(error, 'uploadPlayerPhoto');
    }
  }

  async uploadClubLogo(file: File): Promise<ApiResponse<UploadPhotoResponse>> {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await this.client.post<ApiResponse<UploadPhotoResponse>>(
        '/api/club-photos/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 segundos para conversión HEIC
        }
      );
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseUploadPhotoSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de uploadClubLogo no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<UploadPhotoResponse>(error, 'uploadClubLogo');
    }
  }

  async uploadUserPhoto(file: File): Promise<ApiResponse<UploadPhotoResponse>> {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await this.client.post<ApiResponse<UploadPhotoResponse>>(
        '/api/user-photos/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 segundos para conversión HEIC
        }
      );
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseUploadPhotoSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de uploadUserPhoto no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<UploadPhotoResponse>(error, 'uploadUserPhoto');
    }
  }

  async createEvaluation(evaluation: CreateEvaluationRequest): Promise<ApiResponse<Evaluation>> {
    try {
      const response = await this.client.post<ApiResponse<Evaluation>>('/api/evaluations', evaluation);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseEvaluationSchema);
      if (validated) {
        // Cast explícito para asegurar compatibilidad de tipos
        return validated as ApiResponse<Evaluation>;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de createEvaluation no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<Evaluation>(error, 'createEvaluation');
    }
  }

  async getEvaluations(filters?: GetEvaluationsFilters): Promise<ApiResponse<Evaluation[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.playerId) {
        params.append('playerId', filters.playerId);
      }
      
      if (filters?.evaluatorId) {
        params.append('evaluatorId', filters.evaluatorId);
      }
      
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }
      
      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      
      if (filters?.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }

      const queryString = params.toString();
      const url = `/api/evaluations${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.client.get<ApiResponse<Evaluation[]>>(url);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<Evaluation[]>(error, 'getEvaluations');
    }
  }

  async getEvaluationById(id: string): Promise<ApiResponse<Evaluation>> {
    try {
      const response = await this.client.get<ApiResponse<Evaluation>>(`/api/evaluations/${id}`);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseEvaluationSchema);
      if (validated) {
        // Cast explícito para asegurar compatibilidad de tipos
        return validated as ApiResponse<Evaluation>;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de getEvaluationById no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<Evaluation>(error, 'getEvaluationById');
    }
  }

  async getPlayerEvaluations(playerId: string, filters?: Omit<GetEvaluationsFilters, 'playerId'>): Promise<ApiResponse<Evaluation[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.evaluatorId) {
        params.append('evaluatorId', filters.evaluatorId);
      }
      
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }
      
      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      
      if (filters?.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }

      const queryString = params.toString();
      const url = `/api/evaluations/player/${playerId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.client.get<ApiResponse<Evaluation[]>>(url);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseEvaluationsSchema);
      if (validated) {
        // Cast explícito para asegurar compatibilidad de tipos
        return validated as ApiResponse<Evaluation[]>;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de getPlayerEvaluations no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<Evaluation[]>(error, 'getPlayerEvaluations');
    }
  }

  async updateEvaluation(id: string, evaluation: UpdateEvaluationRequest): Promise<ApiResponse<Evaluation>> {
    try {
      const response = await this.client.put<ApiResponse<Evaluation>>(`/api/evaluations/${id}`, evaluation);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<Evaluation>(error, 'updateEvaluation');
    }
  }

  async deleteEvaluation(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/api/evaluations/${id}`);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<void>(error, 'deleteEvaluation');
    }
  }

  // Evaluation Templates
  async createEvaluationTemplate(template: CreateEvaluationTemplateRequest): Promise<ApiResponse<EvaluationTemplate>> {
    try {
      const response = await this.client.post<ApiResponse<EvaluationTemplate>>('/api/evaluation-templates', template);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<EvaluationTemplate>(error, 'createEvaluationTemplate');
    }
  }

  async getEvaluationTemplates(position?: string): Promise<ApiResponse<EvaluationTemplate[]>> {
    try {
      const url = position 
        ? `/api/evaluation-templates?position=${encodeURIComponent(position)}`
        : '/api/evaluation-templates';
      
      
      const response = await this.client.get<ApiResponse<EvaluationTemplate[]>>(url);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<EvaluationTemplate[]>(error, 'getEvaluationTemplates');
    }
  }

  async getEvaluationTemplateById(id: string): Promise<ApiResponse<EvaluationTemplate>> {
    try {
      const response = await this.client.get<ApiResponse<EvaluationTemplate>>(`/api/evaluation-templates/${id}`);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<EvaluationTemplate>(error, 'getEvaluationTemplateById');
    }
  }

  async updateEvaluationTemplate(id: string, template: UpdateEvaluationTemplateRequest): Promise<ApiResponse<EvaluationTemplate>> {
    try {
      const response = await this.client.put<ApiResponse<EvaluationTemplate>>(`/api/evaluation-templates/${id}`, template);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<EvaluationTemplate>(error, 'updateEvaluationTemplate');
    }
  }

  async deleteEvaluationTemplate(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/api/evaluation-templates/${id}`);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<void>(error, 'deleteEvaluationTemplate');
    }
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats | PlayerStats>> {
    try {
      const response = await this.client.get<ApiResponse<DashboardStats | PlayerStats>>('/api/dashboard/stats');
      // Validar respuesta con Zod (puede ser DashboardStats o PlayerStats)
      const validatedDashboard = safeValidateApiResponse(response.data, ApiResponseDashboardStatsSchema);
      const validatedPlayer = safeValidateApiResponse(response.data, ApiResponsePlayerStatsSchema);
      if (validatedDashboard || validatedPlayer) {
        return validatedDashboard || validatedPlayer || response.data;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de getDashboardStats no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<DashboardStats | PlayerStats>(error, 'getDashboardStats');
    }
  }

  // Clubs (solo SUPER_ADMIN)
  async getClubs(): Promise<ApiResponse<Club[]>> {
    try {
      const response = await this.client.get<ApiResponse<Club[]>>('/api/clubs');
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseClubsSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de getClubs no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<Club[]>(error, 'getClubs');
    }
  }

  async getClubById(id: string): Promise<ApiResponse<Club>> {
    try {
      const response = await this.client.get<ApiResponse<Club>>(`/api/clubs/${id}`);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseClubSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de getClubById no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<Club>(error, 'getClubById');
    }
  }

  async createClub(club: CreateClubRequest): Promise<ApiResponse<Club>> {
    try {
      const response = await this.client.post<ApiResponse<{ club: Club; member: any }>>('/api/clubs', club);
      // El backend devuelve { club, member }, pero solo necesitamos el club
      if (response.data.success && response.data.data) {
        const data = response.data.data as any;
        // Extraer el club del objeto de respuesta
        const clubData = data.club || data;
        return {
          success: true,
          data: clubData as Club,
        };
      }
      return {
        success: false,
        error: 'Error al crear club',
      };
    } catch (error: unknown) {
      return this.handleAxiosError<Club>(error, 'createClub');
    }
  }

  async updateClub(id: string, club: UpdateClubRequest): Promise<ApiResponse<Club>> {
    try {
      const response = await this.client.put<ApiResponse<Club>>(`/api/clubs/${id}`, club);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data as ApiResponse<Club> & { details?: unknown };
        // Si hay detalles de validación, mostrarlos en el error
        if (errorData.details) {
          console.error('Validation details:', errorData.details);
          return {
            success: false,
            error: (errorData as { message?: string; error?: string }).message || errorData.error || 'Error de validación',
            details: errorData.details,
          };
        }
        return errorData as ApiResponse<Club>;
      }
      return this.handleAxiosError<Club>(error, 'updateClub');
    }
  }

  async deleteClub(id: string, hardDelete: boolean = false): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(
        `/api/clubs/${id}${hardDelete ? '?hardDelete=true' : ''}`
      );
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<void>(error, 'deleteClub');
    }
  }

  async getMyClubs(): Promise<ApiResponse<Club[]>> {
    try {
      const response = await this.client.get<ApiResponse<Club[]>>('/api/clubs/me/clubs');
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseClubsSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de getMyClubs no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<Club[]>(error, 'getMyClubs');
    }
  }

  // Subscriptions (solo SUPER_ADMIN)
  async getSubscriptionByClubId(clubId: string): Promise<ApiResponse<Subscription>> {
    try {
      const response = await this.client.get<ApiResponse<Subscription>>(`/api/clubs/${clubId}/subscription`);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseSubscriptionSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de getSubscriptionByClubId no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<Subscription>(error, 'getSubscriptionByClubId');
    }
  }

  async getMySubscription(): Promise<ApiResponse<Subscription>> {
    try {
      const response = await this.client.get<ApiResponse<Subscription>>('/api/clubs/me/subscription');
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<Subscription>(error, 'getMySubscription');
    }
  }

  async createSubscription(clubId: string, subscription: CreateSubscriptionRequest): Promise<ApiResponse<Subscription>> {
    try {
      const response = await this.client.post<ApiResponse<Subscription>>(`/api/clubs/${clubId}/subscription`, subscription);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseSubscriptionSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de createSubscription no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<Subscription>(error, 'createSubscription');
    }
  }

  async updateSubscription(clubId: string, subscription: UpdateSubscriptionRequest): Promise<ApiResponse<Subscription>> {
    try {
      const response = await this.client.put<ApiResponse<Subscription>>(`/api/clubs/${clubId}/subscription`, subscription);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseSubscriptionSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de updateSubscription no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<Subscription>(error, 'updateSubscription');
    }
  }

  // Evaluators (solo ADMIN)
  async getEvaluators(): Promise<ApiResponse<User[]>> {
    try {
      const response = await this.client.get<ApiResponse<User[]>>('/api/users/evaluators');
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseUsersSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de getEvaluators no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<User[]>(error, 'getEvaluators');
    }
  }

  async getEvaluatorById(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.get<ApiResponse<User>>(`/api/users/evaluators/${id}`);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseUserSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de getEvaluatorById no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<User>(error, 'getEvaluatorById');
    }
  }

  async createEvaluator(evaluator: CreateEvaluatorRequest): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.post<ApiResponse<User>>('/api/users/evaluators', evaluator);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseUserSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de createEvaluator no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<User>(error, 'createEvaluator');
    }
  }

  async updateEvaluator(id: string, evaluator: UpdateEvaluatorRequest): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.put<ApiResponse<User>>(`/api/users/evaluators/${id}`, evaluator);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseUserSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de updateEvaluator no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<User>(error, 'updateEvaluator');
    }
  }

  async deleteEvaluator(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/api/users/evaluators/${id}`);
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<void>(error, 'deleteEvaluator');
    }
  }

  // Reports
  async generateEvaluationPDF(evaluationId: string): Promise<{ blob: Blob; filename: string }> {
    try {
      const response = await this.client.get(`/api/reports/evaluations/${evaluationId}/pdf`, {
        responseType: 'blob',
      });
      
      // Extraer el nombre del archivo del header Content-Disposition
      // Con responseType: 'blob', los headers pueden estar en diferentes lugares
      const contentDisposition = 
        response.headers?.['content-disposition'] || 
        response.headers?.['Content-Disposition'] ||
        (response.headers as any)?.['content-disposition'] ||
        (response as any).headers?.['content-disposition'] ||
        (response as any).headers?.['Content-Disposition'];
      
      let filename = `evaluacion-${evaluationId}.pdf`;
      
      if (contentDisposition && typeof contentDisposition === 'string') {
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\s]+)/i);
        if (utf8Match && utf8Match[1]) {
          try {
            filename = decodeURIComponent(utf8Match[1]);
          } catch (e) {
            console.warn('[AxiosApiClient] Error decoding UTF-8 filename:', e);
          }
        }
        
        if (filename === `evaluacion-${evaluationId}.pdf`) {
          const filenameMatch = contentDisposition.match(/filename[^=]*=["']?([^"';]+)["']?/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].trim().replace(/['"]/g, '');
            try {
              filename = decodeURIComponent(filename);
            } catch (e) {
              // Si falla la decodificación, usar el nombre tal cual
            }
          }
        }
      }
      
      return { blob: response.data, filename };
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data as { error?: string };
        throw new Error(errorData.error || 'Error al generar PDF');
      }
      const errorMessage = error instanceof Error ? error.message : 'Error al generar PDF';
      throw new Error(errorMessage);
    }
  }

  async createSharedReport(evaluationId: string, options?: { expiresInDays?: number; maxViews?: number }): Promise<ApiResponse<SharedReport>> {
    try {
      const response = await this.client.post<ApiResponse<SharedReport>>(
        `/api/reports/evaluations/${evaluationId}/share`,
        options || {}
      );
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseSharedReportSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de createSharedReport no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<SharedReport>(error, 'createSharedReport');
    }
  }

  async getSharedReport(token: string): Promise<ApiResponse<{ evaluation: Evaluation; player?: Player | null; evaluator?: User | null; club?: Club | null; sharedReport: SharedReportInfo }>> {
    try {
      const response = await this.client.get<ApiResponse<{ evaluation: Evaluation; player?: Player | null; evaluator?: User | null; club?: Club | null; sharedReport: SharedReportInfo }>>(
        `/api/reports/shared/${token}`
      );
      return response.data;
    } catch (error: unknown) {
      return this.handleAxiosError<{ evaluation: Evaluation; player?: Player | null; evaluator?: User | null; club?: Club | null; sharedReport: SharedReportInfo }>(error, 'getSharedReport');
    }
  }

  async generateSharedReportPDF(token: string): Promise<{ blob: Blob; filename: string }> {
    try {
      const response = await this.client.get(`/api/reports/shared/${token}/pdf`, {
        responseType: 'blob',
      });
      
      // Extraer el nombre del archivo del header Content-Disposition
      // Con responseType: 'blob', los headers pueden estar en diferentes lugares
      const contentDisposition = 
        response.headers?.['content-disposition'] || 
        response.headers?.['Content-Disposition'] ||
        (response.headers as any)?.['content-disposition'] ||
        (response as any).headers?.['content-disposition'] ||
        (response as any).headers?.['Content-Disposition'];
      
      let filename = `evaluacion-compartida-${token}.pdf`;
      
      if (contentDisposition && typeof contentDisposition === 'string') {
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\s]+)/i);
        if (utf8Match && utf8Match[1]) {
          try {
            filename = decodeURIComponent(utf8Match[1]);
          } catch (e) {
            console.warn('[AxiosApiClient] Error decoding UTF-8 filename (shared):', e);
          }
        }
        
        if (filename === `evaluacion-compartida-${token}.pdf`) {
          const filenameMatch = contentDisposition.match(/filename[^=]*=["']?([^"';]+)["']?/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].trim().replace(/['"]/g, '');
            try {
              filename = decodeURIComponent(filename);
            } catch (e) {
              // Si falla la decodificación, usar el nombre tal cual
            }
          }
        }
      }
      
      return { blob: response.data, filename };
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data as { error?: string };
        throw new Error(errorData.error || 'Error al generar PDF');
      }
      const errorMessage = error instanceof Error ? error.message : 'Error al generar PDF';
      throw new Error(errorMessage);
    }
  }

  // Admin (solo SUPER_ADMIN)
  async getPlayersWithoutPassword(): Promise<ApiResponse<PlayerWithoutPassword[]>> {
    try {
      const response = await this.client.get<ApiResponse<PlayerWithoutPassword[]>>('/api/admin/players-without-password');
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponsePlayerWithoutPasswordSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de getPlayersWithoutPassword no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<PlayerWithoutPassword[]>(error, 'getPlayersWithoutPassword');
    }
  }

  async generatePlayerPassword(playerId: string): Promise<ApiResponse<GeneratePasswordResponse>> {
    try {
      const response = await this.client.post<ApiResponse<GeneratePasswordResponse>>(`/api/admin/generate-player-password/${playerId}`);
      // Validar respuesta con Zod
      const validated = safeValidateApiResponse(response.data, ApiResponseGeneratePasswordSchema);
      if (validated) {
        return validated;
      }
      // Si la validación falla pero hay datos, retornarlos con advertencia
      if (response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Respuesta de generatePlayerPassword no validada completamente, pero se retorna:', response.data);
        }
        return response.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error: unknown) {
      return this.handleAxiosError<GeneratePasswordResponse>(error, 'generatePlayerPassword');
    }
  }
}


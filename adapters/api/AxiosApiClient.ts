import axios, { AxiosInstance } from 'axios';
import { 
  IApiClient, 
  LoginRequest, 
  LoginResponse, 
  CreatePlayerRequest, 
  UpdatePlayerRequest,
  ApiResponse,
  GetPlayersFilters,
  CreateEvaluationRequest,
  UpdateEvaluationRequest,
  GetEvaluationsFilters,
  UploadPhotoResponse,
  DashboardStats,
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
} from '../../ports/IApiClient';
import { Player } from '../../domain/entities/Player';
import { Evaluation } from '../../domain/entities/Evaluation';
import { EvaluationTemplate, CreateEvaluationTemplateRequest, UpdateEvaluationTemplateRequest } from '../../domain/entities/EvaluationTemplate';
import { User } from '../../ports/IApiClient';

export class AxiosApiClient implements IApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

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
          // Token expirado o inválido - limpiar token y redirigir al login
          this.token = null;
          if (typeof window !== 'undefined') {
            // Solo redirigir si estamos en el cliente
            const authStorage = localStorage.getItem('scouta-auth-storage');
            if (authStorage) {
              try {
                const parsed = JSON.parse(authStorage);
                if (parsed.state?.token) {
                  // Limpiar el token del store
                  parsed.state.token = null;
                  parsed.state.user = null;
                  parsed.state.isAuthenticated = false;
                  localStorage.setItem('scouta-auth-storage', JSON.stringify(parsed));
                }
              } catch (e) {
                // Si hay error al parsear, simplemente limpiar
                localStorage.removeItem('scouta-auth-storage');
              }
            }
            // Redirigir al login solo si no estamos ya ahí
            if (window.location.pathname !== '/login') {
              window.location.href = '/login?expired=true';
            }
          }
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
      return response.data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error en login:', {
          message: error.message,
          hasResponse: !!error.response,
          hasRequest: !!error.request,
          responseData: error.response?.data,
          baseURL: this.client.defaults.baseURL,
        });
      }

      if (error.response) {
        return error.response.data;
      }
      if (error.request) {
        throw new Error(`No se pudo conectar con el servidor en ${this.client.defaults.baseURL}. Verifica que el backend esté corriendo.`);
      }
      throw new Error(error.message || 'Error desconocido');
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
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error en getPlayers:', {
          message: error.message,
          hasResponse: !!error.response,
          hasRequest: !!error.request,
          responseData: error.response?.data,
          status: error.response?.status,
          baseURL: this.client.defaults.baseURL,
        });
      }
      if (error.response) {
        return error.response.data;
      }
      if (error.request) {
        throw new Error(`No se pudo conectar con el servidor. Verifica que el backend esté corriendo en ${this.client.defaults.baseURL}`);
      }
      throw new Error(error.message || 'Error al obtener jugadores');
    }
  }

  async getPlayerById(id: string): Promise<ApiResponse<Player>> {
    try {
      const response = await this.client.get<ApiResponse<Player>>(`/api/players/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener jugador');
    }
  }

  async createPlayer(player: CreatePlayerRequest): Promise<ApiResponse<Player>> {
    try {
      const response = await this.client.post<ApiResponse<Player>>('/api/players', player);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al crear jugador');
    }
  }

  async updatePlayer(id: string, player: UpdatePlayerRequest): Promise<ApiResponse<Player>> {
    try {
      const response = await this.client.put<ApiResponse<Player>>(`/api/players/${id}`, player);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al actualizar jugador');
    }
  }

  async deletePlayer(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/api/players/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al eliminar jugador');
    }
  }

  async getDeletedPlayers(): Promise<ApiResponse<Player[]>> {
    try {
      const response = await this.client.get<ApiResponse<Player[]>>('/api/players/deleted');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener jugadores eliminados');
    }
  }

  async restorePlayer(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.post<ApiResponse<void>>(`/api/players/${id}/restore`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al restaurar jugador');
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
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al subir foto');
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
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al subir logo');
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
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al subir la foto del usuario');
    }
  }

  async createEvaluation(evaluation: CreateEvaluationRequest): Promise<ApiResponse<Evaluation>> {
    try {
      const response = await this.client.post<ApiResponse<Evaluation>>('/api/evaluations', evaluation);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al crear evaluación');
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
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener evaluaciones');
    }
  }

  async getEvaluationById(id: string): Promise<ApiResponse<Evaluation>> {
    try {
      const response = await this.client.get<ApiResponse<Evaluation>>(`/api/evaluations/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener evaluación');
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
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener evaluaciones del jugador');
    }
  }

  async updateEvaluation(id: string, evaluation: UpdateEvaluationRequest): Promise<ApiResponse<Evaluation>> {
    try {
      const response = await this.client.put<ApiResponse<Evaluation>>(`/api/evaluations/${id}`, evaluation);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al actualizar evaluación');
    }
  }

  async deleteEvaluation(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/api/evaluations/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al eliminar evaluación');
    }
  }

  // Evaluation Templates
  async createEvaluationTemplate(template: CreateEvaluationTemplateRequest): Promise<ApiResponse<EvaluationTemplate>> {
    try {
      const response = await this.client.post<ApiResponse<EvaluationTemplate>>('/api/evaluation-templates', template);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al crear template');
    }
  }

  async getEvaluationTemplates(position?: string): Promise<ApiResponse<EvaluationTemplate[]>> {
    try {
      const url = position 
        ? `/api/evaluation-templates?position=${encodeURIComponent(position)}`
        : '/api/evaluation-templates';
      
      
      const response = await this.client.get<ApiResponse<EvaluationTemplate[]>>(url);
      return response.data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error en getEvaluationTemplates:', {
          message: error.message,
          status: error.response?.status,
          responseData: error.response?.data,
          hasToken: !!this.token,
          headers: error.config?.headers,
        });
      }
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener templates');
    }
  }

  async getEvaluationTemplateById(id: string): Promise<ApiResponse<EvaluationTemplate>> {
    try {
      const response = await this.client.get<ApiResponse<EvaluationTemplate>>(`/api/evaluation-templates/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener template');
    }
  }

  async updateEvaluationTemplate(id: string, template: UpdateEvaluationTemplateRequest): Promise<ApiResponse<EvaluationTemplate>> {
    try {
      const response = await this.client.put<ApiResponse<EvaluationTemplate>>(`/api/evaluation-templates/${id}`, template);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al actualizar template');
    }
  }

  async deleteEvaluationTemplate(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/api/evaluation-templates/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al eliminar template');
    }
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await this.client.get<ApiResponse<DashboardStats>>('/api/dashboard/stats');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener estadísticas del dashboard');
    }
  }

  // Clubs (solo SUPER_ADMIN)
  async getClubs(): Promise<ApiResponse<Club[]>> {
    try {
      const response = await this.client.get<ApiResponse<Club[]>>('/api/clubs');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener clubes');
    }
  }

  async getClubById(id: string): Promise<ApiResponse<Club>> {
    try {
      const response = await this.client.get<ApiResponse<Club>>(`/api/clubs/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener club');
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
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al crear club');
    }
  }

  async updateClub(id: string, club: UpdateClubRequest): Promise<ApiResponse<Club>> {
    try {
      const response = await this.client.put<ApiResponse<Club>>(`/api/clubs/${id}`, club);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Si hay detalles de validación, mostrarlos en el error
        const errorData = error.response.data;
        if (errorData.details) {
          console.error('Validation details:', errorData.details);
          return {
            success: false,
            error: errorData.message || errorData.error || 'Error de validación',
            details: errorData.details,
          };
        }
        return errorData;
      }
      throw new Error(error.message || 'Error al actualizar club');
    }
  }

  async deleteClub(id: string, hardDelete: boolean = false): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(
        `/api/clubs/${id}${hardDelete ? '?hardDelete=true' : ''}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al eliminar club');
    }
  }

  async getMyClubs(): Promise<ApiResponse<Club[]>> {
    try {
      const response = await this.client.get<ApiResponse<Club[]>>('/api/clubs/me/clubs');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener mis clubes');
    }
  }

  // Subscriptions (solo SUPER_ADMIN)
  async getSubscriptionByClubId(clubId: string): Promise<ApiResponse<Subscription>> {
    try {
      const response = await this.client.get<ApiResponse<Subscription>>(`/api/clubs/${clubId}/subscription`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener suscripción');
    }
  }

  async getMySubscription(): Promise<ApiResponse<Subscription>> {
    try {
      const response = await this.client.get<ApiResponse<Subscription>>('/api/clubs/me/subscription');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener mi suscripción');
    }
  }

  async createSubscription(clubId: string, subscription: CreateSubscriptionRequest): Promise<ApiResponse<Subscription>> {
    try {
      const response = await this.client.post<ApiResponse<Subscription>>(`/api/clubs/${clubId}/subscription`, subscription);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al crear suscripción');
    }
  }

  async updateSubscription(clubId: string, subscription: UpdateSubscriptionRequest): Promise<ApiResponse<Subscription>> {
    try {
      const response = await this.client.put<ApiResponse<Subscription>>(`/api/clubs/${clubId}/subscription`, subscription);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al actualizar suscripción');
    }
  }

  // Evaluators (solo ADMIN)
  async getEvaluators(): Promise<ApiResponse<User[]>> {
    try {
      const response = await this.client.get<ApiResponse<User[]>>('/api/users/evaluators');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener evaluadores');
    }
  }

  async getEvaluatorById(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.get<ApiResponse<User>>(`/api/users/evaluators/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener evaluador');
    }
  }

  async createEvaluator(evaluator: CreateEvaluatorRequest): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.post<ApiResponse<User>>('/api/users/evaluators', evaluator);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al crear evaluador');
    }
  }

  async updateEvaluator(id: string, evaluator: UpdateEvaluatorRequest): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.put<ApiResponse<User>>(`/api/users/evaluators/${id}`, evaluator);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al actualizar evaluador');
    }
  }

  async deleteEvaluator(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/api/users/evaluators/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al eliminar evaluador');
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
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.error || 'Error al generar PDF');
      }
      throw new Error(error.message || 'Error al generar PDF');
    }
  }

  async createSharedReport(evaluationId: string, options?: { expiresInDays?: number; maxViews?: number }): Promise<ApiResponse<SharedReport>> {
    try {
      const response = await this.client.post<ApiResponse<SharedReport>>(
        `/api/reports/evaluations/${evaluationId}/share`,
        options || {}
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al crear link compartido');
    }
  }

  async getSharedReport(token: string): Promise<ApiResponse<{ evaluation: Evaluation; player?: Player | null; evaluator?: User | null; club?: Club | null; sharedReport: SharedReportInfo }>> {
    try {
      const response = await this.client.get<ApiResponse<{ evaluation: Evaluation; player?: Player | null; evaluator?: User | null; club?: Club | null; sharedReport: SharedReportInfo }>>(
        `/api/reports/shared/${token}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Error al obtener reporte compartido');
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
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.error || 'Error al generar PDF');
      }
      throw new Error(error.message || 'Error al generar PDF');
    }
  }
}


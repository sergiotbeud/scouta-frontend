import { Evaluation, CreateEvaluationRequest, UpdateEvaluationRequest, GetEvaluationsFilters, ApiResponse } from './IApiClient';
import { EvaluationTemplate, CreateEvaluationTemplateRequest, UpdateEvaluationTemplateRequest } from '../domain/entities/EvaluationTemplate';

/**
 * Interfaz para operaciones relacionadas con evaluaciones
 */
export interface IEvaluationClient {
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
}

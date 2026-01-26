import { User, CreateEvaluatorRequest, UpdateEvaluatorRequest, ApiResponse } from './IApiClient';

/**
 * Interfaz para operaciones relacionadas con evaluadores
 */
export interface IEvaluatorClient {
  getEvaluators(): Promise<ApiResponse<User[]>>;
  getEvaluatorById(id: string): Promise<ApiResponse<User>>;
  createEvaluator(evaluator: CreateEvaluatorRequest): Promise<ApiResponse<User>>;
  updateEvaluator(id: string, evaluator: UpdateEvaluatorRequest): Promise<ApiResponse<User>>;
  deleteEvaluator(id: string): Promise<ApiResponse<void>>;
}

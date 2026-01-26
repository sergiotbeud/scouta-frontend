import { Evaluation, SharedReport, SharedReportInfo, ApiResponse, User, Club } from './IApiClient';

/**
 * Interfaz para operaciones relacionadas con reportes y PDFs
 */
export interface IReportClient {
  generateEvaluationPDF(evaluationId: string): Promise<{ blob: Blob; filename: string }>;
  createSharedReport(evaluationId: string, options?: { expiresInDays?: number; maxViews?: number }): Promise<ApiResponse<SharedReport>>;
  getSharedReport(token: string): Promise<ApiResponse<{ evaluation: Evaluation; player?: any | null; evaluator?: User | null; club?: Club | null; sharedReport: SharedReportInfo }>>;
  generateSharedReportPDF(token: string): Promise<{ blob: Blob; filename: string }>;
}

import { useState } from 'react';
import { useReportClient } from '../hooks/useReportClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { SharedReport } from '../ports/IApiClient';

export function useReports() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportClient = useReportClient();
  const { handleError } = useErrorHandler();

  const generatePDF = async (evaluationId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { blob, filename } = await reportClient.generateEvaluationPDF(evaluationId);
      
      // Crear un link temporal para descargar el PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al generar PDF');
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createSharedLink = async (
    evaluationId: string,
    options?: { expiresInDays?: number; maxViews?: number }
  ): Promise<SharedReport | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reportClient.createSharedReport(evaluationId, options);
      if (response.success && response.data) {
        return response.data;
      }
      setError(response.error || 'Error al crear link compartido');
      return null;
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al crear link compartido');
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateSharedPDF = async (token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { blob, filename } = await reportClient.generateSharedReportPDF(token);
      
      // Crear un link temporal para descargar el PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al generar PDF');
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generatePDF,
    createSharedLink,
    generateSharedPDF,
    isLoading,
    error,
  };
}


import { useState, useEffect } from 'react';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useAuthStore } from '../store/auth-store';
import { SharedReport } from '../ports/IApiClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export function useReports() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
  }, [token]);

  const generatePDF = async (evaluationId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const { blob, filename } = await apiClient.generateEvaluationPDF(evaluationId);
      
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
    } catch (err: any) {
      setError(err.message || 'Error al generar PDF');
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
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.createSharedReport(evaluationId, options);
      if (response.success && response.data) {
        return response.data;
      }
      setError(response.error || 'Error al crear link compartido');
      return null;
    } catch (err: any) {
      setError(err.message || 'Error al crear link compartido');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateSharedPDF = async (token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { blob, filename } = await apiClient.generateSharedReportPDF(token);
      
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
    } catch (err: any) {
      setError(err.message || 'Error al generar PDF');
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


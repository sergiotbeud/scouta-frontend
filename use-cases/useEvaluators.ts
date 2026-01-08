import { useState, useEffect } from 'react';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { User, CreateEvaluatorRequest, UpdateEvaluatorRequest } from '../ports/IApiClient';
import { useAuthStore } from '../store/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export function useEvaluators() {
  const [evaluators, setEvaluators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  const fetchEvaluators = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.getEvaluators();
      if (response.success && response.data) {
        setEvaluators(response.data);
      } else {
        setError(response.error || 'Error al cargar evaluadores');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar evaluadores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEvaluators();
    }
  }, [token]);

  const createEvaluator = async (evaluator: CreateEvaluatorRequest): Promise<User | null> => {
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.createEvaluator(evaluator);
      if (response.success && response.data) {
        await fetchEvaluators(); // Recargar lista
        return response.data;
      } else {
        setError(response.error || 'Error al crear evaluador');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear evaluador');
      return null;
    }
  };

  const updateEvaluator = async (id: string, evaluator: UpdateEvaluatorRequest): Promise<User | null> => {
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.updateEvaluator(id, evaluator);
      if (response.success && response.data) {
        await fetchEvaluators(); // Recargar lista
        return response.data;
      } else {
        setError(response.error || 'Error al actualizar evaluador');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar evaluador');
      return null;
    }
  };

  const deleteEvaluator = async (id: string): Promise<boolean> => {
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.deleteEvaluator(id);
      if (response.success) {
        await fetchEvaluators(); // Recargar lista
        return true;
      } else {
        setError(response.error || 'Error al eliminar evaluador');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar evaluador');
      return false;
    }
  };

  return {
    evaluators,
    isLoading,
    error,
    fetchEvaluators,
    createEvaluator,
    updateEvaluator,
    deleteEvaluator,
  };
}



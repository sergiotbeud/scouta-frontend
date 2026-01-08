import { useState, useEffect } from 'react';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useAuthStore } from '../store/auth-store';
import { Evaluation } from '../domain/entities/Evaluation';
import { CreateEvaluationRequest, UpdateEvaluationRequest, GetEvaluationsFilters } from '../ports/IApiClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export function useEvaluations() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
  }, [token]);

  // Función helper para normalizar items que pueden venir con estructura {props: {...}}
  const normalizeEvaluationItems = (items: any[]): any[] => {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items.map(item => {
      // Si el item tiene una propiedad 'props', extraer las propiedades de ahí
      if (item && typeof item === 'object' && 'props' in item && item.props) {
        return {
          ...item.props,
          createdAt: item.createdAt || item.props.createdAt,
        };
      }
      // Si ya está normalizado, devolverlo tal cual
      return item;
    });
  };

  const fetchEvaluations = async (filters?: GetEvaluationsFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.getEvaluations(filters);
      if (response.success && response.data) {
        // Normalizar los items de todas las evaluaciones
        const normalizedEvaluations = response.data.map(evaluation => ({
          ...evaluation,
          items: normalizeEvaluationItems(evaluation.items),
        }));
        setEvaluations(normalizedEvaluations);
      } else {
        setError(response.error || 'Error al cargar evaluaciones');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar evaluaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayerEvaluations = async (playerId: string, filters?: Omit<GetEvaluationsFilters, 'playerId'>): Promise<Evaluation[]> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.getPlayerEvaluations(playerId, filters);
      if (response.success && response.data) {
        // Normalizar los items de todas las evaluaciones
        const normalizedEvaluations = response.data.map(evaluation => ({
          ...evaluation,
          items: normalizeEvaluationItems(evaluation.items),
        }));
        setEvaluations(normalizedEvaluations);
        return normalizedEvaluations;
      } else {
        setError(response.error || 'Error al cargar evaluaciones');
        return [];
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar evaluaciones');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvaluationById = async (id: string): Promise<Evaluation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.getEvaluationById(id);
      if (response.success && response.data) {
        // Normalizar los items si vienen con estructura {props: {...}}
        const normalizedData = {
          ...response.data,
          items: normalizeEvaluationItems(response.data.items),
        };
        return normalizedData;
      } else {
        setError(response.error || 'Error al cargar evaluación');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar evaluación');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createEvaluation = async (evaluationData: CreateEvaluationRequest): Promise<Evaluation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.createEvaluation(evaluationData);
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Error al crear evaluación');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear evaluación');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEvaluation = async (id: string, evaluationData: UpdateEvaluationRequest): Promise<Evaluation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.updateEvaluation(id, evaluationData);
      if (response.success && response.data) {
        // Normalizar los items si vienen con estructura {props: {...}}
        const normalizedData = {
          ...response.data,
          items: normalizeEvaluationItems(response.data.items),
        };
        // Actualizar en la lista local
        setEvaluations(prev => prev.map(e => e.id === id ? normalizedData : e));
        return normalizedData;
      } else {
        setError(response.error || 'Error al actualizar evaluación');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar evaluación');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvaluation = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.deleteEvaluation(id);
      if (response.success) {
        // Remover de la lista local si existe
        setEvaluations(prev => prev.filter(e => e.id !== id));
        return true;
      } else {
        setError(response.error || 'Error al eliminar evaluación');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar evaluación');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    evaluations,
    isLoading,
    error,
    fetchEvaluations,
    fetchPlayerEvaluations,
    fetchEvaluationById,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
  };
}


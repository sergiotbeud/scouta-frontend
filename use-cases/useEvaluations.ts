import { useState } from 'react';
import { useEvaluationClient } from '../hooks/useEvaluationClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Evaluation } from '../domain/entities/Evaluation';
import { CreateEvaluationRequest, UpdateEvaluationRequest, GetEvaluationsFilters } from '../ports/IApiClient';

export function useEvaluations() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const evaluationClient = useEvaluationClient();
  const { handleError } = useErrorHandler();

  // Función helper para normalizar items que pueden venir con estructura {props: {...}}
  const normalizeEvaluationItems = (items: any[] | undefined): any[] => {
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
      const response = await evaluationClient.getEvaluations(filters);
      if (response.success && response.data) {
        // Normalizar los items de todas las evaluaciones
        const normalizedEvaluations = response.data.map(evaluation => ({
          ...evaluation,
          items: normalizeEvaluationItems(evaluation.items || []),
        }));
        setEvaluations(normalizedEvaluations);
      } else {
        setError(response.error || 'Error al cargar evaluaciones');
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al cargar evaluaciones');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayerEvaluations = async (playerId: string, filters?: Omit<GetEvaluationsFilters, 'playerId'>): Promise<Evaluation[]> => {
    setIsLoading(true);
    setError(null);
    try {
      // El token se configura automáticamente en useEvaluationClient
      const response = await evaluationClient.getPlayerEvaluations(playerId, filters);
      if (response.success && response.data) {
        // Normalizar los items de todas las evaluaciones
        const normalizedEvaluations = response.data.map(evaluation => ({
          ...evaluation,
          items: normalizeEvaluationItems(evaluation.items || []),
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
      // El token se configura automáticamente en useEvaluationClient
      const response = await evaluationClient.getEvaluationById(id);
      if (response.success && response.data) {
        // Normalizar los items si vienen con estructura {props: {...}}
        const normalizedData = {
          ...response.data,
          items: normalizeEvaluationItems(response.data.items || []),
        };
        return normalizedData;
      } else {
        setError(response.error || 'Error al cargar evaluación');
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al cargar evaluación');
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createEvaluation = async (evaluationData: CreateEvaluationRequest): Promise<Evaluation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // El token se configura automáticamente en useEvaluationClient
      const response = await evaluationClient.createEvaluation(evaluationData);
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Error al crear evaluación');
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al crear evaluación');
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEvaluation = async (id: string, evaluationData: UpdateEvaluationRequest): Promise<Evaluation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // El token se configura automáticamente en useEvaluationClient
      const response = await evaluationClient.updateEvaluation(id, evaluationData);
      if (response.success && response.data) {
        // Normalizar los items si vienen con estructura {props: {...}}
        const normalizedData = {
          ...response.data,
          items: normalizeEvaluationItems(response.data.items || []),
        };
        // Actualizar en la lista local
        setEvaluations(prev => prev.map(e => e.id === id ? normalizedData : e));
        return normalizedData;
      } else {
        setError(response.error || 'Error al actualizar evaluación');
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al actualizar evaluación');
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvaluation = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // El token se configura automáticamente en useEvaluationClient
      const response = await evaluationClient.deleteEvaluation(id);
      if (response.success) {
        // Remover de la lista local si existe
        setEvaluations(prev => prev.filter(e => e.id !== id));
        return true;
      } else {
        setError(response.error || 'Error al eliminar evaluación');
        return false;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al eliminar evaluación');
      setError(errorMessage);
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


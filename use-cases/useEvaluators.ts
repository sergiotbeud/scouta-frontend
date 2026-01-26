import { useState, useEffect } from 'react';
import { useEvaluatorClient } from '../hooks/useEvaluatorClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useAuthStore } from '../store/auth-store';
import { User, CreateEvaluatorRequest, UpdateEvaluatorRequest } from '../ports/IApiClient';

export function useEvaluators() {
  const [evaluators, setEvaluators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoadCompleted, setHasInitialLoadCompleted] = useState(false);
  const token = useAuthStore((state) => state.token);
  const evaluatorClient = useEvaluatorClient();
  const { handleError } = useErrorHandler();

  const fetchEvaluators = async (): Promise<void> => {
    // No hacer la llamada si no hay token disponible
    if (!token) {
      setIsLoading(false);
      setHasInitialLoadCompleted(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await evaluatorClient.getEvaluators();
      if (response.success && response.data) {
        setEvaluators(response.data);
      } else {
        // Solo establecer error después de la carga inicial
        if (hasInitialLoadCompleted) {
          setError(response.error || 'Error al cargar evaluadores');
        }
      }
    } catch (err: unknown) {
      // Solo establecer error después de la carga inicial
      if (hasInitialLoadCompleted) {
        const errorMessage = handleError(err, 'Error al cargar evaluadores');
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setHasInitialLoadCompleted(true);
    }
  };

  useEffect(() => {
    // Solo hacer la llamada si hay token disponible
    if (token) {
      fetchEvaluators();
    } else {
      setIsLoading(false);
      setHasInitialLoadCompleted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const createEvaluator = async (evaluator: CreateEvaluatorRequest): Promise<User | null> => {
    try {
      const response = await evaluatorClient.createEvaluator(evaluator);
      if (response.success && response.data) {
        await fetchEvaluators(); // Recargar lista
        return response.data;
      } else {
        setError(response.error || 'Error al crear evaluador');
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al crear evaluador');
      setError(errorMessage);
      return null;
    }
  };

  const updateEvaluator = async (id: string, evaluator: UpdateEvaluatorRequest): Promise<User | null> => {
    try {
      // El token se configura automáticamente en useEvaluatorClient
      const response = await evaluatorClient.updateEvaluator(id, evaluator);
      if (response.success && response.data) {
        await fetchEvaluators(); // Recargar lista
        return response.data;
      } else {
        setError(response.error || 'Error al actualizar evaluador');
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al actualizar evaluador');
      setError(errorMessage);
      return null;
    }
  };

  const deleteEvaluator = async (id: string): Promise<boolean> => {
    try {
      const response = await evaluatorClient.deleteEvaluator(id);
      if (response.success) {
        await fetchEvaluators(); // Recargar lista
        return true;
      } else {
        setError(response.error || 'Error al eliminar evaluador');
        return false;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al eliminar evaluador');
      setError(errorMessage);
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






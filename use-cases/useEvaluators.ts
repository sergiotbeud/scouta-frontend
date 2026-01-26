import { useState, useEffect } from 'react';
import { useEvaluatorClient } from '../hooks/useEvaluatorClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { User, CreateEvaluatorRequest, UpdateEvaluatorRequest } from '../ports/IApiClient';

export function useEvaluators() {
  const [evaluators, setEvaluators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const evaluatorClient = useEvaluatorClient();
  const { handleError } = useErrorHandler();

  const fetchEvaluators = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await evaluatorClient.getEvaluators();
      if (response.success && response.data) {
        setEvaluators(response.data);
      } else {
        setError(response.error || 'Error al cargar evaluadores');
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al cargar evaluadores');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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






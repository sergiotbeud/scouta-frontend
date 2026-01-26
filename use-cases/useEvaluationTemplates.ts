import { useState } from 'react';
import { useEvaluationClient } from '../hooks/useEvaluationClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { EvaluationTemplate, CreateEvaluationTemplateRequest, UpdateEvaluationTemplateRequest } from '../domain/entities/EvaluationTemplate';

export function useEvaluationTemplates() {
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const evaluationClient = useEvaluationClient();
  const { handleError } = useErrorHandler();

  const fetchTemplates = async (position?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // El token se configura automáticamente en useEvaluationClient
      const response = await evaluationClient.getEvaluationTemplates(position);
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        const errorMessage = response.error || 'Error al cargar templates';
        setError(errorMessage);
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al cargar templates');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (template: CreateEvaluationTemplateRequest): Promise<EvaluationTemplate | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await evaluationClient.createEvaluationTemplate(template);
      if (response.success && response.data) {
        setTemplates(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        setError(response.error || 'Error al crear template');
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al crear template');
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = async (id: string, template: UpdateEvaluationTemplateRequest): Promise<EvaluationTemplate | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await evaluationClient.updateEvaluationTemplate(id, template);
      if (response.success && response.data) {
        setTemplates(prev => prev.map(t => t.id === id ? response.data! : t));
        return response.data;
      } else {
        setError(response.error || 'Error al actualizar template');
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al actualizar template');
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await evaluationClient.deleteEvaluationTemplate(id);
      if (response.success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        return true;
      } else {
        setError(response.error || 'Error al eliminar template');
        return false;
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al eliminar template');
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}


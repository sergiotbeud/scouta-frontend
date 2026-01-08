import { useState, useEffect } from 'react';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useAuthStore } from '../store/auth-store';
import { EvaluationTemplate, CreateEvaluationTemplateRequest, UpdateEvaluationTemplateRequest } from '../domain/entities/EvaluationTemplate';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export function useEvaluationTemplates() {
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
  }, [token]);

  const fetchTemplates = async (position?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // Asegurar que el token esté configurado antes de hacer la petición
      if (!token) {
        const errorMsg = 'No hay token de autenticación. Por favor, inicia sesión nuevamente.';
        setError(errorMsg);
        setIsLoading(false);
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ fetchTemplates - No token disponible');
        }
        return;
      }
      
      // Configurar el token justo antes de hacer la petición
      apiClient.setToken(token);
      const response = await apiClient.getEvaluationTemplates(position);
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        const errorMessage = response.error || 'Error al cargar templates';
        setError(errorMessage);
      }
    } catch (err: any) {
      let errorMessage = 'Error al cargar templates';
      if (err.response?.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        // Si el token expiró, podría ser útil limpiar el token del store
        // pero eso lo manejará el componente de login
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error en fetchTemplates (catch):', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          hasToken: !!token,
          error: err
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (template: CreateEvaluationTemplateRequest): Promise<EvaluationTemplate | null> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.createEvaluationTemplate(template);
      if (response.success && response.data) {
        setTemplates(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        setError(response.error || 'Error al crear template');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear template');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = async (id: string, template: UpdateEvaluationTemplateRequest): Promise<EvaluationTemplate | null> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.updateEvaluationTemplate(id, template);
      if (response.success && response.data) {
        setTemplates(prev => prev.map(t => t.id === id ? response.data! : t));
        return response.data;
      } else {
        setError(response.error || 'Error al actualizar template');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar template');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.deleteEvaluationTemplate(id);
      if (response.success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        return true;
      } else {
        setError(response.error || 'Error al eliminar template');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar template');
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


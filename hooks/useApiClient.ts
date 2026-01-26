import { useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/auth-store';
import { getApiClient } from '../infrastructure/di/container';
import { IApiClient } from '../ports/IApiClient';

/**
 * Hook para obtener la instancia del API client desde el DI Container.
 * Sincroniza automáticamente el token cuando cambia en el store.
 * 
 * @returns Instancia de IApiClient configurada y lista para usar
 */
export function useApiClient(): IApiClient {
  const token = useAuthStore((state) => state.token);
  
  // Obtener la instancia del API client (singleton)
  const apiClient = useMemo(() => getApiClient(), []);

  // Sincronizar token cuando cambia en el store
  useEffect(() => {
    apiClient.setToken(token);
  }, [token, apiClient]);

  return apiClient;
}

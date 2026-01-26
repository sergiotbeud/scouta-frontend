import { useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/auth-store';
import { container } from '../infrastructure/di/container';
import { IPlayerClient } from '../ports/IPlayerClient';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';

/**
 * Hook para obtener la instancia del Player Client desde el DI Container.
 * Sincroniza automáticamente el token cuando cambia en el store.
 * 
 * @returns Instancia de IPlayerClient configurada y lista para usar
 */
export function usePlayerClient(): IPlayerClient {
  const token = useAuthStore((state) => state.token);
  
  // Obtener la instancia del API client (singleton)
  const apiClient = useMemo(() => container.resolve<AxiosApiClient>(AxiosApiClient), []);

  // Sincronizar token cuando cambia en el store
  useEffect(() => {
    apiClient.setToken(token);
  }, [token, apiClient]);

  return apiClient;
}

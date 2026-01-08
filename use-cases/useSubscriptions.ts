import { useState, useEffect } from 'react';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useAuthStore } from '../store/auth-store';
import { Subscription, CreateSubscriptionRequest, UpdateSubscriptionRequest } from '../ports/IApiClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export function useSubscription(clubId: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  // Cargar suscripción automáticamente cuando cambia el clubId
  useEffect(() => {
    if (clubId && token) {
      fetchSubscription();
    } else {
      // Si no hay clubId, limpiar la suscripción
      setSubscription(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, token]);

  const fetchSubscription = async (): Promise<void> => {
    if (!clubId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.getSubscriptionByClubId(clubId);
      if (response.success && response.data) {
        setSubscription(response.data);
        setError(null); // Limpiar cualquier error previo
      } else {
        // Si no existe suscripción, no es un error, simplemente no hay suscripción
        if (response.error?.includes('not found') || response.error?.includes('Subscription not found')) {
          setSubscription(null);
          setError(null); // No es un error, simplemente no hay suscripción
        } else {
          setError(response.error || 'Error al cargar suscripción');
          setSubscription(null); // Limpiar suscripción si hay error
        }
      }
    } catch (err: any) {
      // Si es 404, no hay suscripción (no es un error)
      if (err.response?.status === 404) {
        setSubscription(null);
      } else {
        setError(err.message || 'Error al cargar suscripción');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createSubscription = async (data: CreateSubscriptionRequest): Promise<boolean> => {
    if (!clubId) return false;
    
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.createSubscription(clubId, data);
      if (response.success && response.data) {
        setSubscription(response.data);
        return true;
      } else {
        setError(response.error || 'Error al crear suscripción');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear suscripción');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscription = async (data: UpdateSubscriptionRequest): Promise<boolean> => {
    if (!clubId) return false;
    
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.updateSubscription(clubId, data);
      if (response.success && response.data) {
        setSubscription(response.data);
        return true;
      } else {
        setError(response.error || 'Error al actualizar suscripción');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar suscripción');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscription,
    isLoading,
    error,
    fetchSubscription,
    createSubscription,
    updateSubscription,
  };
}

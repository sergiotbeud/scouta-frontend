import { useState, useEffect } from 'react';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useAuthStore } from '../store/auth-store';
import { Subscription } from '../ports/IApiClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export function useMySubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // ADMIN y EVALUATOR pueden ver la suscripción de su club
    if (token && user && (user.role === 'ADMIN' || user.role === 'admin' || user.role === 'EVALUATOR' || user.role === 'evaluator')) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const fetchSubscription = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.getMySubscription();
      if (response.success && response.data) {
        setSubscription(response.data);
        setError(null);
      } else {
        if (response.error?.includes('not found') || response.error?.includes('Subscription not found')) {
          setSubscription(null);
          setError(null);
        } else {
          setError(response.error || 'Error al cargar suscripción');
          setSubscription(null);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setSubscription(null);
        setError(null);
      } else {
        setError(err.message || 'Error al cargar suscripción');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscription,
    isLoading,
    error,
    fetchSubscription,
  };
}



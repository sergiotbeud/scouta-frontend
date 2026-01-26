import { useState, useEffect } from 'react';
import { useSubscriptionClient } from '../hooks/useSubscriptionClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { isAxiosError } from '../utils/typeGuards';
import { useAuthStore } from '../store/auth-store';
import { Subscription } from '../ports/IApiClient';
import { UserRole } from '../domain/entities/User';

export function useMySubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoadCompleted, setHasInitialLoadCompleted] = useState(false);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const subscriptionClient = useSubscriptionClient();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    // ADMIN y EVALUATOR pueden ver la suscripción de su club
    if (token && user && (user.role === UserRole.ADMIN || user.role === UserRole.EVALUATOR)) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setError(null);
      setHasInitialLoadCompleted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const fetchSubscription = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subscriptionClient.getMySubscription();
      if (response.success && response.data) {
        setSubscription(response.data);
        setError(null);
      } else {
        if (response.error?.includes('not found') || response.error?.includes('Subscription not found')) {
          setSubscription(null);
          setError(null);
        } else {
          // Solo establecer error después de la carga inicial
          if (hasInitialLoadCompleted) {
            setError(response.error || 'Error al cargar suscripción');
          }
          setSubscription(null);
        }
      }
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setSubscription(null);
        setError(null);
      } else {
        // Solo establecer error después de la carga inicial
        if (hasInitialLoadCompleted) {
          const errorMessage = handleError(err, 'Error al cargar suscripción');
          setError(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
      setHasInitialLoadCompleted(true);
    }
  };

  return {
    subscription,
    isLoading,
    error,
    fetchSubscription,
  };
}



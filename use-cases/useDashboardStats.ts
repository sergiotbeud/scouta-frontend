import { useState, useEffect } from 'react';
import { useAdminClient } from '../hooks/useAdminClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { DashboardStats, PlayerStats } from '../ports/IApiClient';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adminClient = useAdminClient();
  const { handleError } = useErrorHandler();

  const fetchStats = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminClient.getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Error al cargar estadísticas');
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al cargar estadísticas');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
}







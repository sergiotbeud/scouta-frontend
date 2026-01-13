import { useState, useEffect } from 'react';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useAuthStore } from '../store/auth-store';
import { DashboardStats, PlayerStats } from '../ports/IApiClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
  }, [token]);

  const fetchStats = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Error al cargar estadísticas');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
}







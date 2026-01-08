import { useState, useEffect } from 'react';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useAuthStore } from '../store/auth-store';
import { Club } from '../ports/IApiClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
  }, [token]);

  const fetchClubs = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.getClubs();
      if (response.success && response.data) {
        setClubs(response.data);
      } else {
        setError(response.error || 'Error al cargar clubes');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar clubes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClubs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return {
    clubs,
    isLoading,
    error,
    fetchClubs,
  };
}


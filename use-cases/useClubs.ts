import { useState, useEffect } from 'react';
import { useClubClient } from '../hooks/useClubClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Club } from '../ports/IApiClient';

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clubClient = useClubClient();
  const { handleError } = useErrorHandler();

  const fetchClubs = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await clubClient.getClubs();
      if (response.success && response.data) {
        setClubs(response.data);
      } else {
        setError(response.error || 'Error al cargar clubes');
      }
    } catch (err: unknown) {
      const errorMessage = handleError(err, 'Error al cargar clubes');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    clubs,
    isLoading,
    error,
    fetchClubs,
  };
}


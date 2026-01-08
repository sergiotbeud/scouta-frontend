'use client';

import { useAuthStore } from '../../../store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AxiosApiClient } from '../../../adapters/api/AxiosApiClient';
import { useAuthStore as useAuth } from '../../../store/auth-store';
import { Player } from '../../../domain/entities/Player';
import Link from 'next/link';
import { ScoutaLogo } from '../../../components/ScoutaLogo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export default function DeletedPlayersPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuth((state) => state.token);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [deletedPlayers, setDeletedPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    const fetchDeletedPlayers = async () => {
      if (!mounted || !isAuthenticated || !token) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        apiClient.setToken(token);
        const response = await apiClient.getDeletedPlayers();
        if (response.success && response.data) {
          setDeletedPlayers(response.data);
        } else {
          setError(response.error || 'Error al cargar jugadores eliminados');
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar jugadores eliminados');
      } finally {
        setIsLoading(false);
      }
    };

    if (mounted && isAuthenticated) {
      fetchDeletedPlayers();
    }
  }, [mounted, isAuthenticated, token]);

  const handleRestore = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas restaurar este jugador?')) {
      return;
    }

    setRestoringId(id);
    setError(null);
    
    try {
      if (token) {
        apiClient.setToken(token);
      }
      const response = await apiClient.restorePlayer(id);
      if (response.success) {
        // Remover el jugador de la lista
        setDeletedPlayers(prev => prev.filter(p => p.id !== id));
        // Opcional: redirigir a la página de jugadores
        setTimeout(() => {
          router.push('/players');
        }, 1000);
      } else {
        setError(response.error || 'Error al restaurar jugador');
      }
    } catch (err: any) {
      setError(err.message || 'Error al restaurar jugador');
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface/80 backdrop-blur-xl border-b border-dark-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/players" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center shadow-lg shadow-success/20">
                <ScoutaLogo size="sm" className="text-success" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Scouta</h1>
                <p className="text-xs text-dark-text-secondary font-light">Jugadores Eliminados</p>
              </div>
            </Link>
            <Link
              href="/players"
              className="px-4 py-2 text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a Jugadores
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-error rounded-full"></div>
            <div>
              <h2 className="text-4xl font-bold text-white mb-1.5">
                Jugadores Eliminados
              </h2>
              <p className="text-dark-text-secondary font-light">
                Gestiona los jugadores que han sido eliminados del sistema
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-error/20 border border-error/30 text-error-light px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white">Cargando jugadores eliminados...</div>
          </div>
        ) : deletedPlayers.length === 0 ? (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-12 shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-elevated flex items-center justify-center">
              <svg className="w-10 h-10 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay jugadores eliminados
            </h3>
            <p className="text-dark-text-secondary mb-6">
              Todos los jugadores están activos en el sistema
            </p>
            <Link
              href="/players"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a Jugadores
            </Link>
          </div>
        ) : (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-8 shadow-2xl">
            <div className="mb-6">
              <p className="text-dark-text-secondary">
                Se encontraron <span className="text-white font-semibold">{deletedPlayers.length}</span> jugador{deletedPlayers.length !== 1 ? 'es' : ''} eliminado{deletedPlayers.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              {deletedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="bg-dark-elevated border border-dark-border/50 rounded-xl p-6 hover:border-dark-border transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-bold text-white">
                          {player.name}
                        </h3>
                        <span className="px-3 py-1 bg-error/20 text-error-light text-xs font-semibold rounded-full">
                          Eliminado
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-dark-text-secondary">Posiciones:</span>
                          <p className="text-white font-medium mt-1">
                            {player.positions.join(', ')}
                          </p>
                        </div>
                        <div>
                          <span className="text-dark-text-secondary">Edad:</span>
                          <p className="text-white font-medium mt-1">{player.age} años</p>
                        </div>
                        {player.height && (
                          <div>
                            <span className="text-dark-text-secondary">Altura:</span>
                            <p className="text-white font-medium mt-1">{player.height}m</p>
                          </div>
                        )}
                        {player.weight && (
                          <div>
                            <span className="text-dark-text-secondary">Peso:</span>
                            <p className="text-white font-medium mt-1">{player.weight}kg</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-dark-border/50">
                        <span className="text-xs text-dark-text-tertiary">
                          Eliminado el: {player.deletedAt ? formatDate(player.deletedAt) : 'Fecha no disponible'}
                        </span>
                      </div>
                    </div>

                    <div className="ml-6 flex items-center gap-3">
                      <button
                        onClick={() => handleRestore(player.id)}
                        disabled={restoringId === player.id}
                        className="px-6 py-3 bg-success hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-success/30"
                      >
                        {restoringId === player.id ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Restaurando...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Restaurar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


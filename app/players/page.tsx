'use client';

import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePlayers } from '../../use-cases/usePlayers';
import Link from 'next/link';
import { AppHeader } from '../../components/AppHeader';
import { PlayerFilters } from '../../components/PlayerFilters';
import { SubscriptionBlockedBanner } from '../../components/SubscriptionBlockedBanner';
import { GetPlayersFilters } from '../../ports/IApiClient';
import { UserRole } from '../../domain/entities/User';
import { useMySubscription } from '../../use-cases/useMySubscription';

export default function PlayersPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { players, isLoading, error, fetchPlayers, deletePlayer } = usePlayers();
  const [filters, setFilters] = useState<GetPlayersFilters>({});
  const { subscription } = useMySubscription();
  const isSubscriptionActive = subscription?.status === 'ACTIVE';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (mounted && user && user.role === UserRole.SUPER_ADMIN) {
      router.push('/dashboard');
    }
  }, [mounted, user, router]);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchPlayers(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated, filters]);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este jugador?')) {
      await deletePlayer(id);
    }
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
      <AppHeader title="Scouta" subtitle="Jugadores" showBackButton={true} backUrl="/dashboard" backLabel="Volver al Dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <SubscriptionBlockedBanner />
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-primary rounded-full"></div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-1.5">
                  Jugadores
                </h2>
                <p className="text-dark-text-secondary font-light">
                  Gestiona los jugadores de tu club
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Link
                href="/players/deleted"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200 border border-dark-border/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminados
              </Link>
              <Link
                href="/players/new"
                className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-success text-white font-semibold rounded-lg transition-all duration-200 shadow-lg text-sm sm:text-base ${
                  !isSubscriptionActive 
                    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                    : 'hover:opacity-95 hover:shadow-xl hover:shadow-success/30'
                }`}
                title={!isSubscriptionActive ? 'Suscripción inactiva' : ''}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Jugador
              </Link>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <PlayerFilters
          filters={filters}
          onFiltersChange={setFilters}
          availablePositions={[
            'Portero',
            'Defensor Central',
            'Lateral Izquierdo',
            'Lateral Derecho',
            'Mediocampista Defensivo',
            'Mediocampista Central',
            'Mediocampista Ofensivo',
            'Extremo Izquierdo',
            'Extremo Derecho',
            'Delantero Centro',
            'Segundo Delantero',
          ]}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-error/20 border border-error/30 text-error-light px-4 py-3 rounded-xl flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Contador de resultados */}
        {!isLoading && !error && (
          <div className="mb-4 text-sm text-dark-text-secondary">
            {players.length === 0 ? (
              <span>No se encontraron jugadores</span>
            ) : (
              <span>
                {players.length} jugador{players.length !== 1 ? 'es' : ''} encontrado{players.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && players.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-dark-text-secondary">Cargando jugadores...</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && players.length === 0 && !error && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-elevated flex items-center justify-center">
              <svg className="w-10 h-10 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">No hay jugadores registrados</h3>
            <p className="text-dark-text-secondary mb-6">
              Comienza agregando tu primer jugador al sistema
            </p>
            <Link
              href="/players/new"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-success hover:opacity-95 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-success/30 text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Primer Jugador
            </Link>
          </div>
        )}

        {/* Players List */}
        {!isLoading && players.length > 0 && (
          <>
            {/* Vista de tabla (Desktop) */}
            <div className="hidden lg:block bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-dark-elevated/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                      Foto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                      Edad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                      Altura
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                      Peso
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/30">
                  {players.map((player) => (
                    <tr key={player.id} className="hover:bg-dark-elevated/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {player.photoUrl ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${player.photoUrl}`}
                            alt={player.name}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-dark-border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-dark-elevated border-2 border-dark-border flex items-center justify-center">
                            <svg className="w-6 h-6 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white font-medium">{player.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-dark-text-secondary">
                          {player.positions.join(', ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-dark-text-secondary">{player.age} años</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-dark-text-secondary">
                          {player.height ? `${player.height}m` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-dark-text-secondary">
                          {player.weight ? `${player.weight}kg` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/evaluations/new?playerId=${player.id}`}
                            className="px-3 py-1.5 bg-success/20 hover:bg-success/30 text-success-light rounded-lg transition-colors text-xs font-semibold"
                            title="Evaluar jugador"
                          >
                            Evaluar
                          </Link>
                          <Link
                            href={`/players/${player.id}`}
                            className="text-primary-400 hover:text-primary-300 transition-colors"
                          >
                            Ver
                          </Link>
                          <button
                            onClick={() => handleDelete(player.id)}
                            disabled={!isSubscriptionActive}
                            className={`transition-colors ${
                              !isSubscriptionActive 
                                ? 'opacity-50 cursor-not-allowed text-dark-text-tertiary' 
                                : 'text-error-light hover:text-error'
                            }`}
                            title={!isSubscriptionActive ? 'Suscripción inactiva' : ''}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Vista de cards (Mobile/Tablet) */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl hover:border-primary-500/50 transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {player.photoUrl ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${player.photoUrl}`}
                        alt={player.name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-dark-border flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-dark-elevated border-2 border-dark-border flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{player.name}</h3>
                      <p className="text-sm text-dark-text-secondary">{player.age} años</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-xs text-dark-text-tertiary">Posición:</span>
                      <p className="text-sm text-white">{player.positions.join(', ')}</p>
                    </div>
                    {(player.height || player.weight) && (
                      <div className="flex gap-4 text-sm">
                        {player.height && (
                          <div>
                            <span className="text-dark-text-tertiary">Altura: </span>
                            <span className="text-white">{player.height}m</span>
                          </div>
                        )}
                        {player.weight && (
                          <div>
                            <span className="text-dark-text-tertiary">Peso: </span>
                            <span className="text-white">{player.weight}kg</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/players/${player.id}`}
                      className="w-full px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-xl font-semibold transition-all border border-primary-500/50 text-center text-sm"
                    >
                      Ver Detalles
                    </Link>
                    <div className="flex gap-2">
                      <Link
                        href={`/evaluations/new?playerId=${player.id}`}
                        className="flex-1 px-4 py-2 bg-success/20 hover:bg-success/30 text-success-light rounded-xl font-semibold transition-all text-center text-sm"
                      >
                        Evaluar
                      </Link>
                      <button
                        onClick={() => handleDelete(player.id)}
                        className="flex-1 px-4 py-2 bg-error/20 hover:bg-error/30 text-error-light rounded-xl font-semibold transition-all text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}


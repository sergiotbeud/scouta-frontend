'use client';

import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useEvaluations } from '../../use-cases/useEvaluations';
import { usePlayers } from '../../use-cases/usePlayers';
import Link from 'next/link';
import { AppHeader } from '../../components/AppHeader';
import { SubscriptionBlockedBanner } from '../../components/SubscriptionBlockedBanner';
import { Evaluation } from '../../domain/entities/Evaluation';
import { GetEvaluationsFilters, Club } from '../../ports/IApiClient';
import { UserRole } from '../../domain/entities/User';
import { useMySubscription } from '../../use-cases/useMySubscription';
import { AxiosApiClient } from '../../adapters/api/AxiosApiClient';
import { Player } from '../../domain/entities/Player';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export default function EvaluationsPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { evaluations, isLoading, error, fetchEvaluations, deleteEvaluation } = useEvaluations();
  const { players, fetchPlayers } = usePlayers();
  const [filters, setFilters] = useState<GetEvaluationsFilters>({});
  const { subscription } = useMySubscription();
  const isSubscriptionActive = subscription?.status === 'ACTIVE';
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'latest' | 'all'>('latest');
  const [playersData, setPlayersData] = useState<Map<string, Player>>(new Map());
  const [clubsData, setClubsData] = useState<Map<string, Club>>(new Map());
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (mounted && user && (user.role === UserRole.SUPER_ADMIN || user.role === 'SUPER_ADMIN')) {
      router.push('/dashboard');
    }
  }, [mounted, user, router]);

  useEffect(() => {
    if (mounted && isAuthenticated && token) {
      apiClient.setToken(token);
      fetchPlayers();
      fetchEvaluations(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated, filters, token]);

  // Cargar datos completos de jugadores y clubes
  useEffect(() => {
    const loadPlayersAndClubs = async () => {
      if (!mounted || !isAuthenticated || !token || players.length === 0) return;

      const playersMap = new Map<string, Player>();
      const clubsMap = new Map<string, Club>();
      const clubIds = new Set<string>();

      // Cargar datos completos de cada jugador
      for (const player of players) {
        try {
          const playerResponse = await apiClient.getPlayerById(player.id);
          if (playerResponse.success && playerResponse.data) {
            playersMap.set(player.id, playerResponse.data);
            // Agregar clubId a la lista de clubes a cargar
            if (playerResponse.data.clubId) {
              clubIds.add(playerResponse.data.clubId);
            }
          }
        } catch (error) {
          console.error(`Error al cargar jugador ${player.id}:`, error);
        }
      }

      // Cargar datos de los clubes
      for (const clubId of clubIds) {
        try {
          const clubResponse = await apiClient.getClubById(clubId);
          if (clubResponse.success && clubResponse.data) {
            clubsMap.set(clubId, clubResponse.data);
          }
        } catch (error) {
          console.error(`Error al cargar club ${clubId}:`, error);
        }
      }

      setPlayersData(playersMap);
      setClubsData(clubsMap);
    };

    loadPlayersAndClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated, token, players]);

  // Actualizar filtros cuando cambien los selectores
  useEffect(() => {
    const newFilters: GetEvaluationsFilters = {
      ...(selectedPlayerId && { playerId: selectedPlayerId }),
      ...(selectedEvaluatorId && { evaluatorId: selectedEvaluatorId }),
      sortBy: 'date',
      sortOrder: 'desc',
    };
    setFilters(newFilters);
  }, [selectedPlayerId, selectedEvaluatorId]);

  const getPlayerName = (playerId: string) => {
    const player = playersData.get(playerId) || players.find(p => p.id === playerId);
    return player?.name || 'Jugador desconocido';
  };

  const getPlayer = (playerId: string): Player | null => {
    return playersData.get(playerId) || players.find(p => p.id === playerId) || null;
  };

  const getClub = (playerId: string): Club | null => {
    const player = getPlayer(playerId);
    if (player?.clubId) {
      return clubsData.get(player.clubId) || null;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtrar y agrupar evaluaciones
  const processedEvaluations = useMemo(() => {
    let filtered = [...evaluations];

    // Filtrar por búsqueda de texto (nombre del jugador)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(evaluation => {
        const playerName = getPlayerName(evaluation.playerId).toLowerCase();
        return playerName.includes(query);
      });
    }

    // Si el modo es 'latest', agrupar por jugador y tomar solo la más reciente
    if (viewMode === 'latest') {
      const groupedByPlayer = new Map<string, Evaluation>();
      filtered.forEach(evaluation => {
        const existing = groupedByPlayer.get(evaluation.playerId);
        if (!existing || new Date(evaluation.date) > new Date(existing.date)) {
          groupedByPlayer.set(evaluation.playerId, evaluation);
        }
      });
      filtered = Array.from(groupedByPlayer.values());
    }

    // Ordenar por fecha (más recientes primero)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [evaluations, searchQuery, viewMode, players]);

  // Obtener lista única de evaluadores (para el filtro)
  const evaluators = useMemo(() => {
    const evaluatorSet = new Set<string>();
    evaluations.forEach(evaluation => {
      if (evaluation.evaluatorId) {
        evaluatorSet.add(evaluation.evaluatorId);
      }
    });
    return Array.from(evaluatorSet);
  }, [evaluations]);

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <AppHeader title="Scouta" subtitle="Evaluaciones" showBackButton={true} backUrl="/dashboard" backLabel="Volver al Dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubscriptionBlockedBanner />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-0">
              {viewMode === 'latest' ? 'Últimas Evaluaciones por Jugador' : 'Todas las Evaluaciones'}
            </h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('latest')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-semibold transition-all text-sm ${
                viewMode === 'latest'
                  ? 'bg-success text-white'
                  : 'bg-dark-elevated text-dark-text-secondary hover:bg-dark-hover'
              }`}
            >
              Últimas
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-semibold transition-all text-sm ${
                viewMode === 'all'
                  ? 'bg-success text-white'
                  : 'bg-dark-elevated text-dark-text-secondary hover:bg-dark-hover'
              }`}
            >
              Todas
            </button>
          </div>
        </div>
        
        {/* Botón Nueva Evaluación */}
        <div className="mb-6">
          <Link
            href="/evaluations/new"
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-success text-white font-semibold rounded-xl transition-all duration-200 shadow-lg text-sm sm:text-base w-full sm:w-auto ${
              !isSubscriptionActive 
                ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                : 'hover:opacity-95 hover:shadow-xl hover:shadow-success/30'
            }`}
            title={!isSubscriptionActive ? 'Suscripción inactiva' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Evaluación
          </Link>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Buscador por nombre de jugador */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Buscar por Jugador
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nombre del jugador..."
                  className="w-full px-4 py-2 pr-10 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50"
                />
                {searchQuery.trim() && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-text-tertiary hover:text-white transition-colors p-1"
                    type="button"
                    title="Limpiar búsqueda"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filtro por jugador */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Filtrar por Jugador
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full px-4 py-2 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-success/50 [&>option]:bg-dark-elevated [&>option]:text-white"
              >
                <option value="">Todos los jugadores</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por evaluador */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Filtrar por Evaluador
              </label>
              <select
                value={selectedEvaluatorId}
                onChange={(e) => setSelectedEvaluatorId(e.target.value)}
                className="w-full px-4 py-2 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-success/50 [&>option]:bg-dark-elevated [&>option]:text-white"
              >
                <option value="">Todos los evaluadores</option>
                {evaluators.map((evaluatorId) => {
                  // Mostrar el nombre del usuario actual si es el evaluador
                  const evaluatorName = evaluatorId === user.id 
                    ? user.name || user.email 
                    : `Evaluador ${evaluatorId.slice(0, 8)}`;
                  return (
                    <option key={evaluatorId} value={evaluatorId}>
                      {evaluatorName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Botón para limpiar filtros */}
          {(searchQuery || selectedPlayerId || selectedEvaluatorId) && (
            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPlayerId('');
                  setSelectedEvaluatorId('');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-dark-elevated hover:bg-dark-hover text-white rounded-xl font-semibold transition-all border border-dark-border text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-error/20 border border-error/30 text-error-light px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="text-dark-text-secondary">Cargando evaluaciones...</div>
          </div>
        )}

        {/* Lista de evaluaciones */}
        {!isLoading && processedEvaluations.length === 0 && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-12 text-center">
            <p className="text-dark-text-secondary mb-4">
              {searchQuery || selectedPlayerId || selectedEvaluatorId
                ? 'No se encontraron evaluaciones con los filtros aplicados'
                : 'No hay evaluaciones registradas'}
            </p>
            {(!searchQuery && !selectedPlayerId && !selectedEvaluatorId) && (
              <Link
                href="/evaluations/new"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-success hover:opacity-95 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-success/30 text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Primera Evaluación
              </Link>
            )}
          </div>
        )}

        {!isLoading && processedEvaluations.length > 0 && (
          <>
            <div className="mb-4 text-sm text-dark-text-secondary">
              Mostrando {processedEvaluations.length} evaluación{processedEvaluations.length !== 1 ? 'es' : ''}
              {viewMode === 'latest' && evaluations.length > processedEvaluations.length && (
                <span className="ml-2">
                  (de {evaluations.length} total)
                </span>
              )}
            </div>
            <div className="space-y-4">
              {processedEvaluations.map((evaluation) => {
                const player = getPlayer(evaluation.playerId);
                const club = getClub(evaluation.playerId);
                return (
                  <div
                    key={evaluation.id}
                    className="bg-gradient-to-br from-success/10 via-dark-surface/80 to-dark-surface/80 backdrop-blur-xl border border-success/20 rounded-3xl p-6 shadow-2xl hover:border-success/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Foto del jugador */}
                      {player && player.photoUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={`${API_URL}${player.photoUrl}`}
                            alt={player.name}
                            className="w-20 h-20 rounded-xl object-cover border-2 border-success/30 shadow-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Información principal */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/evaluations/${evaluation.id}`}
                          className="block"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-white mb-1">
                                {getPlayerName(evaluation.playerId)}
                              </h3>
                              {club && (
                                <p className="text-success/80 text-sm mb-1">
                                  {club.name}
                                </p>
                              )}
                              <p className="text-dark-text-secondary text-sm">
                                {formatDate(evaluation.date)}
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4 ml-4">
                              <div className="text-right">
                                {evaluation.generalScore !== null && evaluation.generalScore !== undefined && (
                                  <div className="text-xl sm:text-2xl font-bold text-success mb-1">
                                    {evaluation.generalScore.toFixed(1)} / 5.0
                                  </div>
                                )}
                                <div className="text-xs sm:text-sm text-dark-text-tertiary">
                                  {evaluation.items?.length || 0} items
                                </div>
                              </div>
                              <div className="flex gap-2 sm:gap-3">
                                <Link
                                  href={`/evaluations/${evaluation.id}/edit`}
                                  className="px-3 sm:px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-xl font-semibold transition-all border border-primary-500/50 text-sm text-center"
                                  title="Editar evaluación"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Editar
                                </Link>
                                <button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm('¿Estás seguro de que deseas eliminar esta evaluación? Esta acción no se puede deshacer.')) {
                                      const success = await deleteEvaluation(evaluation.id);
                                      if (success) {
                                        fetchEvaluations(filters);
                                      }
                                    }
                                  }}
                                  disabled={isLoading || !isSubscriptionActive}
                                  className={`px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all border text-sm ${
                                    !isSubscriptionActive
                                      ? 'opacity-50 cursor-not-allowed bg-dark-elevated text-dark-text-tertiary border-dark-border'
                                      : 'bg-error/20 hover:bg-error/30 text-error-light border-error/30'
                                  }`}
                                  title={!isSubscriptionActive ? 'Suscripción inactiva' : 'Eliminar evaluación'}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        </Link>
                        {evaluation.observations && (
                          <p className="mt-3 text-dark-text-secondary line-clamp-2">
                            {evaluation.observations}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}


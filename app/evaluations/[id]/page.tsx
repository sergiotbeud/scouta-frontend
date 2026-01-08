'use client';

import { useAuthStore } from '../../../store/auth-store';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useEvaluations } from '../../../use-cases/useEvaluations';
import { usePlayers } from '../../../use-cases/usePlayers';
import { useReports } from '../../../use-cases/useReports';
import Link from 'next/link';
import { AppHeader } from '../../../components/AppHeader';
import { Evaluation } from '../../../domain/entities/Evaluation';
import { EvaluationRadarChart } from '../../../components/RadarChart';
import { getCategoryAverages, prepareRadarChartData, calculateCategoryAverage, calculateStrengthsAndWeaknesses } from '../../../utils/evaluationUtils';
import { SharedReport, Club } from '../../../ports/IApiClient';
import { Player } from '../../../domain/entities/Player';
import { AxiosApiClient } from '../../../adapters/api/AxiosApiClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export default function EvaluationDetailPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [previousEvaluation, setPreviousEvaluation] = useState<Evaluation | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [isEditingStrengths, setIsEditingStrengths] = useState(false);
  const [isEditingWeaknesses, setIsEditingWeaknesses] = useState(false);
  const [editableStrengths, setEditableStrengths] = useState<string[]>([]);
  const [editableWeaknesses, setEditableWeaknesses] = useState<string[]>([]);
  const [sharedReport, setSharedReport] = useState<SharedReport | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
  const [maxViews, setMaxViews] = useState<number | undefined>(undefined);
  const { fetchEvaluationById, fetchPlayerEvaluations, updateEvaluation, deleteEvaluation, isLoading, error } = useEvaluations();
  const { players, fetchPlayers } = usePlayers();
  const { generatePDF, createSharedLink, isLoading: isReportLoading, error: reportError } = useReports();
  const evaluationId = params.id as string;
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
    const loadData = async () => {
      if (mounted && isAuthenticated && evaluationId && token) {
        apiClient.setToken(token);
        await fetchPlayers();
        const evalData = await fetchEvaluationById(evaluationId);
        if (evalData) {
          setEvaluation(evalData);
          
          try {
            const playerResponse = await apiClient.getPlayerById(evalData.playerId);
            if (playerResponse.success && playerResponse.data) {
              setPlayer(playerResponse.data);
              
              if (playerResponse.data.clubId) {
                try {
                  const clubResponse = await apiClient.getClubById(playerResponse.data.clubId);
                  if (clubResponse.success && clubResponse.data) {
                    setClub(clubResponse.data);
                  }
                } catch (error) {
                  console.error('Error al cargar club:', error);
                }
              }
            }
          } catch (error) {
            console.error('Error al cargar jugador:', error);
          }
          
          const playerEvaluations = await fetchPlayerEvaluations(evalData.playerId);
          if (playerEvaluations && Array.isArray(playerEvaluations)) {
            const sortedEvaluations = playerEvaluations
              .filter(e => e.id !== evalData.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            if (sortedEvaluations.length > 0) {
              setPreviousEvaluation(sortedEvaluations[0]);
            }
          }
        }
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated, evaluationId, token]);

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Jugador desconocido';
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

  const handleSaveStrengths = async () => {
    if (!evaluation) return;
    const result = await updateEvaluation(evaluation.id, {
      strengths: editableStrengths,
    });
    if (result) {
      setEvaluation(result);
      setIsEditingStrengths(false);
    }
  };

  const handleSaveWeaknesses = async () => {
    if (!evaluation) return;
    const result = await updateEvaluation(evaluation.id, {
      weaknesses: editableWeaknesses,
    });
    if (result) {
      setEvaluation(result);
      setIsEditingWeaknesses(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    'técnico': 'Técnico',
    'táctico': 'Táctico',
    'físico': 'Físico',
    'cognitivo': 'Cognitivo',
    'psicológico': 'Psicológico',
    'biomédico': 'Biomédico',
  };

  const getItemsByCategory = (category: string) => {
    return evaluation?.items?.filter(item => item.category === category) || [];
  };

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando evaluación...</div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <AppHeader title="Scouta" subtitle="Evaluaciones" showBackButton={true} backUrl="/evaluations" backLabel="Volver a Evaluaciones" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-error/20 border border-error/30 text-error-light px-4 py-3 rounded-xl">
            {error || 'Evaluación no encontrada'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <AppHeader title="Scouta" subtitle={`Evaluación: ${getPlayerName(evaluation.playerId)}`} showBackButton={true} backUrl="/evaluations" backLabel="Volver a Evaluaciones" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header de la evaluación con foto del jugador y datos relevantes */}
        <div className="bg-gradient-to-br from-success/10 via-dark-surface/80 to-dark-surface/80 backdrop-blur-xl border border-success/20 rounded-3xl p-6 shadow-2xl mb-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Foto del jugador */}
            {player && player.photoUrl && (
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src={`${API_URL}${player.photoUrl}`}
                    alt={player.name}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-success/30 shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Información principal */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {player?.name || getPlayerName(evaluation.playerId)}
                  </h1>
                  {club && (
                    <p className="text-success/80 text-sm mb-1">
                      {club.name}
                    </p>
                  )}
                  <p className="text-dark-text-secondary mb-1">
                    {formatDate(evaluation.date)}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  {evaluation.generalScore !== null && evaluation.generalScore !== undefined && (
                    <div className="text-left sm:text-right">
                      <div className="text-3xl sm:text-4xl font-bold text-success mb-1">
                        {evaluation.generalScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-dark-text-tertiary">/ 5.0</div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={async () => {
                    const success = await generatePDF(evaluationId);
                    if (!success && reportError) {
                      alert(`Error al generar PDF: ${reportError}`);
                    }
                  }}
                  className="px-4 py-2 bg-success/20 hover:bg-success/30 text-success-light rounded-xl font-semibold transition-all border border-success/30 flex items-center gap-2"
                  disabled={isReportLoading}
                  title="Generar PDF de la evaluación"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {isReportLoading ? 'Generando...' : 'PDF'}
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-xl font-semibold transition-all border border-primary-500/50 flex items-center gap-2"
                  title="Compartir evaluación"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Compartir
                </button>
                <Link
                  href={`/evaluations/${evaluationId}/edit`}
                  className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-xl font-semibold transition-all border border-primary-500/50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </Link>
                <button
                  onClick={async () => {
                    if (confirm('¿Estás seguro de que deseas eliminar esta evaluación? Esta acción no se puede deshacer.')) {
                      const success = await deleteEvaluation(evaluationId);
                      if (success) {
                        router.push('/evaluations');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-error/20 hover:bg-error/30 text-error-light rounded-xl font-semibold transition-all border border-error/30 flex items-center gap-2"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isLoading ? 'Eliminando...' : 'Eliminar'}
                </button>
                  </div>
                </div>
              </div>

              {/* Información detallada del jugador */}
              {player && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {player.age && (
                    <div>
                      <p className="text-xs text-dark-text-secondary mb-1">Edad</p>
                      <p className="text-white font-semibold">{player.age} años</p>
                    </div>
                  )}
                  {player.positions && player.positions.length > 0 && (
                    <div>
                      <p className="text-xs text-dark-text-secondary mb-1">Posiciones</p>
                      <p className="text-white font-semibold text-sm">
                        {Array.isArray(player.positions) ? player.positions.join(', ') : player.positions}
                      </p>
                    </div>
                  )}
                  {player.height && (
                    <div>
                      <p className="text-xs text-dark-text-secondary mb-1">Estatura</p>
                      <p className="text-white font-semibold">{player.height} cm</p>
                    </div>
                  )}
                  {player.weight && (
                    <div>
                      <p className="text-xs text-dark-text-secondary mb-1">Peso</p>
                      <p className="text-white font-semibold">{player.weight} kg</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gráfico Radar */}
        {evaluation && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Gráfico de Rendimiento</h2>
            {(() => {
              const { data, comparisonData } = prepareRadarChartData(
                evaluation, 
                previousEvaluation && previousEvaluation.id !== evaluation.id ? previousEvaluation : undefined
              );
              
              const filteredData = data.filter(d => d.value > 0);
              const filteredComparison = previousEvaluation && previousEvaluation.id !== evaluation.id 
                ? comparisonData?.filter(d => d.value > 0)
                : undefined;
              
              if (filteredData.length === 0) {
                return (
                  <div className="bg-dark-elevated rounded-xl p-4 text-center text-dark-text-secondary">
                    <p>No hay datos suficientes para mostrar el gráfico</p>
                    <p className="text-xs mt-2 text-dark-text-tertiary">
                      Items: {evaluation.items?.length || 0} | 
                      Categorías con datos: {data.filter(d => d.value > 0).length}
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="bg-dark-elevated rounded-xl p-4">
                  <EvaluationRadarChart 
                    data={filteredData} 
                    comparisonData={filteredComparison} 
                    maxValue={5} 
                  />
                </div>
              );
            })()}
          </div>
        )}

            {/* Promedios por Categoría */}
            {evaluation && (
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl mb-6">
                <h2 className="text-xl font-bold text-white mb-4">Promedios por Categoría</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    const averages = getCategoryAverages(evaluation);
                    const previousAverages = previousEvaluation ? getCategoryAverages(previousEvaluation) : null;
                    
                    const validAverages = Object.entries(averages).filter(([_, avg]) => avg !== null);
                    if (validAverages.length === 0) {
                      return (
                        <div className="col-span-full text-center text-dark-text-secondary py-8">
                          <p>No hay promedios disponibles para mostrar</p>
                          <p className="text-xs mt-2 text-dark-text-tertiary">
                            Items totales: {evaluation.items?.length || 0}
                          </p>
                        </div>
                      );
                    }
                    
                    return Object.entries(averages).map(([category, average]) => {
                      if (average === null) return null;
                  
                  const previousAvg = previousAverages?.[category as keyof typeof previousAverages];
                  const difference = previousAvg !== null && previousAvg !== undefined 
                    ? average - previousAvg 
                    : null;
                  
                  return (
                    <div
                      key={category}
                      className="bg-dark-elevated border border-dark-border rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{categoryLabels[category]}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-success text-xl font-bold">{average.toFixed(1)}</span>
                          <span className="text-dark-text-tertiary text-sm">/ 5.0</span>
                        </div>
                      </div>
                      {/* Barra de progreso */}
                      <div className="h-2 bg-dark-surface rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-success transition-all"
                          style={{ width: `${(average / 5) * 100}%` }}
                        />
                      </div>
                      {/* Comparación con evaluación anterior */}
                      {difference !== null && (
                        <div className={`text-xs flex items-center gap-1 ${
                          difference > 0 ? 'text-success' : difference < 0 ? 'text-error-light' : 'text-dark-text-tertiary'
                        }`}>
                          {difference > 0 && '↑'}
                          {difference < 0 && '↓'}
                          {difference !== 0 && `${Math.abs(difference).toFixed(1)} pts`}
                          {difference === 0 && 'Sin cambios'}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {evaluation.observations && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl mb-6">
            <h2 className="text-xl font-bold text-white mb-3">Observaciones</h2>
            <p className="text-dark-text-secondary whitespace-pre-wrap">
              {evaluation.observations}
            </p>
          </div>
        )}

        {/* Fortalezas y Debilidades */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fortalezas */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-success">✅</span>
                  Fortalezas
                </h2>
                <button
                  onClick={() => {
                    if (isEditingStrengths) {
                      setEditableStrengths(evaluation?.strengths || []);
                      setIsEditingStrengths(false);
                    } else {
                      setEditableStrengths(evaluation?.strengths || []);
                      setIsEditingStrengths(true);
                    }
                  }}
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  {isEditingStrengths ? 'Cancelar' : 'Editar'}
                </button>
              </div>
              
              {isEditingStrengths ? (
                <div>
                  <textarea
                    value={editableStrengths.join('\n')}
                    onChange={(e) => setEditableStrengths(
                      e.target.value.split('\n').filter(line => line.trim())
                    )}
                    placeholder="Escribe cada fortaleza en una línea nueva..."
                    className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50 min-h-[150px]"
                    rows={6}
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleSaveStrengths}
                      disabled={isLoading}
                      className="px-4 py-2 bg-success hover:bg-success/90 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setEditableStrengths(evaluation?.strengths || []);
                        setIsEditingStrengths(false);
                      }}
                      className="px-4 py-2 bg-dark-elevated hover:bg-dark-hover text-white rounded-xl font-semibold transition-all border border-dark-border"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {evaluation?.strengths && evaluation.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {evaluation.strengths.map((strength, index) => (
                        <li key={index} className="text-dark-text-secondary flex items-start gap-2">
                          <span className="text-success mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-dark-text-tertiary italic">
                      No hay fortalezas registradas
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Debilidades */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-error-light">⚠️</span>
                  Debilidades
                </h2>
                <button
                  onClick={() => {
                    if (isEditingWeaknesses) {
                      setEditableWeaknesses(evaluation?.weaknesses || []);
                      setIsEditingWeaknesses(false);
                    } else {
                      setEditableWeaknesses(evaluation?.weaknesses || []);
                      setIsEditingWeaknesses(true);
                    }
                  }}
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  {isEditingWeaknesses ? 'Cancelar' : 'Editar'}
                </button>
              </div>
              
              {isEditingWeaknesses ? (
                <div>
                  <textarea
                    value={editableWeaknesses.join('\n')}
                    onChange={(e) => setEditableWeaknesses(
                      e.target.value.split('\n').filter(line => line.trim())
                    )}
                    placeholder="Escribe cada debilidad en una línea nueva..."
                    className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-error/50 min-h-[150px]"
                    rows={6}
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleSaveWeaknesses}
                      disabled={isLoading}
                      className="px-4 py-2 bg-error hover:bg-error/90 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setEditableWeaknesses(evaluation?.weaknesses || []);
                        setIsEditingWeaknesses(false);
                      }}
                      className="px-4 py-2 bg-dark-elevated hover:bg-dark-hover text-white rounded-xl font-semibold transition-all border border-dark-border"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {evaluation?.weaknesses && evaluation.weaknesses.length > 0 ? (
                    <ul className="space-y-2">
                      {evaluation.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-dark-text-secondary flex items-start gap-2">
                          <span className="text-error-light mt-1">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-dark-text-tertiary italic">
                      No hay debilidades registradas
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items por categoría */}
        <div className="space-y-6">
          {['técnico', 'táctico', 'físico', 'cognitivo', 'psicológico', 'biomédico'].map((category) => {
            const items = getItemsByCategory(category);
            if (items.length === 0) return null;

            const categoryAverage = evaluation ? calculateCategoryAverage(evaluation, category as any) : null;

            return (
              <div
                key={category}
                className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    {categoryLabels[category]}
                  </h2>
                  {categoryAverage !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-success text-lg font-bold">{categoryAverage.toFixed(1)}</span>
                      <span className="text-dark-text-tertiary text-sm">/ 5.0</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-dark-elevated border border-dark-border rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{item.itemName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-success text-lg font-bold">{item.value}</span>
                          <span className="text-dark-text-tertiary text-sm">/ 5</span>
                        </div>
                      </div>
                      {/* Barra de progreso visual */}
                      <div className="mt-2 h-2 bg-dark-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success transition-all"
                          style={{ width: `${(item.value / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal para compartir */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Compartir Evaluación</h3>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setSharedReport(null);
                  setExpiresInDays(undefined);
                  setMaxViews(undefined);
                }}
                className="text-dark-text-secondary hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!sharedReport ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Expira en (días) - Opcional
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expiresInDays || ''}
                    onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-2 bg-dark-elevated border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Sin expiración"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Máximo de vistas - Opcional
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxViews || ''}
                    onChange={(e) => setMaxViews(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-2 bg-dark-elevated border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Sin límite"
                  />
                </div>
                {reportError && (
                  <div className="bg-error/20 border border-error/50 rounded-lg p-3 text-error-light text-sm">
                    {reportError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (expiresInDays !== undefined && (expiresInDays < 1 || isNaN(expiresInDays))) {
                        alert('Los días de expiración deben ser un número mayor a 0');
                        return;
                      }
                      if (maxViews !== undefined && (maxViews < 1 || isNaN(maxViews))) {
                        alert('El máximo de vistas debe ser un número mayor a 0');
                        return;
                      }
                      
                      const result = await createSharedLink(evaluationId, {
                        expiresInDays,
                        maxViews,
                      });
                      if (result) {
                        setSharedReport(result);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                    disabled={isReportLoading}
                  >
                    {isReportLoading ? 'Creando...' : 'Crear Link'}
                  </button>
                  <button
                    onClick={() => {
                      setShowShareModal(false);
                      setExpiresInDays(undefined);
                      setMaxViews(undefined);
                    }}
                    className="px-4 py-2 bg-dark-elevated hover:bg-dark-border text-white rounded-lg font-semibold transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-success/20 border border-success/50 rounded-lg p-4">
                  <p className="text-success-light text-sm mb-2 font-semibold">
                    ✓ Link creado exitosamente
                  </p>
                  <div className="bg-dark-elevated rounded-lg p-3 mb-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={sharedReport.shareUrl || ''}
                      readOnly
                      id="share-url-input"
                      className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => {
                        if (sharedReport.shareUrl) {
                          navigator.clipboard.writeText(sharedReport.shareUrl);
                          // Mejor feedback visual
                          const button = document.getElementById('copy-button');
                          if (button) {
                            const originalText = button.textContent;
                            button.textContent = '✓ Copiado';
                            button.classList.add('bg-success');
                            setTimeout(() => {
                              button.textContent = originalText;
                              button.classList.remove('bg-success');
                            }, 2000);
                          }
                        }
                      }}
                      id="copy-button"
                      className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                    >
                      Copiar Link
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {sharedReport.expiresAt && (
                    <div className="flex items-center gap-2 text-dark-text-secondary">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Expira: {new Date(sharedReport.expiresAt).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  )}
                  {sharedReport.maxViews && (
                    <div className="flex items-center gap-2 text-dark-text-secondary">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Máximo de vistas: {sharedReport.maxViews}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-dark-text-secondary">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Vistas actuales: {sharedReport.viewCount}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSharedReport(null);
                    setExpiresInDays(undefined);
                    setMaxViews(undefined);
                  }}
                  className="w-full px-4 py-2 bg-dark-elevated hover:bg-dark-border text-white rounded-lg font-semibold transition-all"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


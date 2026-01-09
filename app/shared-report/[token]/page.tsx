'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AxiosApiClient } from '../../../adapters/api/AxiosApiClient';
import { Evaluation } from '../../../domain/entities/Evaluation';
import { Player } from '../../../domain/entities/Player';
import { User, UserRole } from '../../../domain/entities/User';
import { SharedReportInfo, Club } from '../../../ports/IApiClient';
import { useReports } from '../../../use-cases/useReports';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);
import { getCategoryAverages, prepareRadarChartData } from '../../../utils/evaluationUtils';
import { getImageUrl } from '../../../utils/imageUtils';

// Importación dinámica para evitar problemas de SSR con recharts
const EvaluationRadarChart = dynamic(
  () => import('../../../components/RadarChart').then(mod => ({ default: mod.EvaluationRadarChart })),
  { ssr: false }
);

export default function SharedReportPage() {
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const token = params.token as string;
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [evaluator, setEvaluator] = useState<User | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [sharedReport, setSharedReport] = useState<SharedReportInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { generateSharedPDF, isLoading: isPdfLoading } = useReports();

  // Inicializar mounted para evitar problemas de SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Función helper para normalizar items que pueden venir con estructura {props: {...}}
  const normalizeEvaluationItems = (items: any[]): any[] => {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items.map(item => {
      // Si el item tiene una propiedad 'props', extraer las propiedades de ahí
      if (item && typeof item === 'object' && 'props' in item && item.props) {
        return {
          ...item.props,
          createdAt: item.createdAt || item.props.createdAt,
        };
      }
      // Si ya está normalizado, devolverlo tal cual
      return item;
    });
  };

  useEffect(() => {
    if (!mounted || !token) return;

    const loadReport = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getSharedReport(token);
        if (response.success && response.data) {
          // Normalizar los items si vienen con estructura {props: {...}}
          const normalizedEvaluation = {
            ...response.data.evaluation,
            items: normalizeEvaluationItems(response.data.evaluation?.items || []),
          };
          
          setEvaluation(normalizedEvaluation);
          setPlayer(response.data.player || null);
          // Normalizar evaluator: convertir role de string a UserRole enum
          const evaluatorData = response.data.evaluator;
          setEvaluator(evaluatorData ? {
            ...evaluatorData,
            role: evaluatorData.role as UserRole,
          } : null);
          setClub(response.data.club || null);
          setSharedReport(response.data.sharedReport);
        } else {
          setError(response.error || 'No se pudo cargar el reporte');
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar el reporte');
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [mounted, token]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando reporte...</div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-error-light text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">Reporte no disponible</h1>
            <p className="text-dark-text-secondary mb-6">{error || 'El reporte no existe o ha expirado'}</p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categoryAverages = getCategoryAverages(evaluation);
  const { data: radarData } = prepareRadarChartData(evaluation);

  const categoryLabels: Record<string, string> = {
    'técnico': 'Técnico',
    'táctico': 'Táctico',
    'físico': 'Físico',
    'cognitivo': 'Cognitivo',
    'psicológico': 'Psicológico',
    'biomédico': 'Biomédico',
  };

  const categories = Object.keys(categoryLabels);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header con branding de Scouta */}
      <div className="bg-gradient-to-r from-success/20 via-success/10 to-transparent border-b border-success/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo/Icono de Scouta */}
              <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Scouta</h1>
                <p className="text-xs text-success/80">Sistema de Evaluación Deportiva</p>
              </div>
            </div>
            {club && (
              <div className="text-right">
                <p className="text-sm text-dark-text-secondary">Club</p>
                <p className="text-white font-semibold">{club.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header principal con foto del jugador */}
        <div className="bg-gradient-to-br from-success/10 via-dark-surface/80 to-dark-surface/80 backdrop-blur-xl border border-success/20 rounded-3xl p-6 shadow-2xl mb-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Foto del jugador */}
            {player && player.photoUrl && (
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src={getImageUrl(player.photoUrl) || ''}
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
                    {player?.name || 'Jugador'}
                  </h1>
                  <p className="text-dark-text-secondary mb-1">
                    Reporte de Evaluación
                  </p>
                  {sharedReport && (
                    <p className="text-xs text-dark-text-tertiary">
                      Compartido • {sharedReport.viewCount} {sharedReport.viewCount === 1 ? 'vista' : 'vistas'}
                    </p>
                  )}
                </div>
                <button
                  onClick={async () => {
                    await generateSharedPDF(token);
                  }}
                  className="px-4 py-2 bg-success/20 hover:bg-success/30 text-success-light rounded-xl font-semibold transition-all border border-success/30 flex items-center gap-2"
                  disabled={isPdfLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {isPdfLoading ? 'Generando...' : 'Descargar PDF'}
                </button>
              </div>

              {/* Información detallada del jugador */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {player && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Información de la evaluación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-success/20">
            <div>
              <p className="text-xs text-dark-text-secondary mb-1">Fecha de Evaluación</p>
              <p className="text-white font-semibold">
                {new Date(evaluation.date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {evaluation.generalScore !== null && evaluation.generalScore !== undefined && (
              <div>
                <p className="text-xs text-dark-text-secondary mb-1">Calificación General</p>
                <p className="text-success text-2xl font-bold">
                  {evaluation.generalScore.toFixed(1)} / 5.0
                </p>
              </div>
            )}
            {evaluator && (
              <div>
                <p className="text-xs text-dark-text-secondary mb-1">Evaluador</p>
                <p className="text-white font-semibold">{evaluator.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico Radar */}
        {radarData && radarData.length > 0 && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Gráfico de Rendimiento</h2>
            <div className="bg-dark-elevated rounded-xl p-4">
              <EvaluationRadarChart data={radarData} />
            </div>
          </div>
        )}

        {/* Promedios por categoría */}
        {Object.keys(categoryAverages).some(key => categoryAverages[key as keyof typeof categoryAverages] !== null) && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Promedios por Categoría</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const avg = categoryAverages[category as keyof typeof categoryAverages];
                if (avg === null) return null;

                const percentage = (avg / 5) * 100;

                return (
                  <div
                    key={category}
                    className="bg-dark-elevated rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold">{categoryLabels[category]}</h3>
                      <span className="text-success font-bold">{avg.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-dark-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items por categoría */}
        {categories.map((category) => {
          const items = evaluation.items?.filter(item => item.category === category) || [];
          if (items.length === 0) return null;

          const categoryAverage = categoryAverages[category as keyof typeof categoryAverages];

          return (
            <div
              key={category}
              className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl mb-6"
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
                {items.map((item) => {
                  const value = typeof item.value === 'number' ? item.value : 0;
                  const percentage = item.dataType === 'scale_1_5' ? (value / 5) * 100 : 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-dark-elevated rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{item.itemName}</span>
                        <span className="text-success font-bold">
                          {item.dataType === 'scale_1_5' ? `${value}/5` : 
                           item.dataType === 'percentage' ? `${value}%` : 
                           String(value)}
                        </span>
                      </div>
                      {item.dataType === 'scale_1_5' && (
                        <div className="mt-2 h-2 bg-dark-surface rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Fortalezas y Debilidades */}
        {(evaluation.strengths && evaluation.strengths.length > 0) || 
         (evaluation.weaknesses && evaluation.weaknesses.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Fortalezas</h2>
                <ul className="space-y-2">
                  {evaluation.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-dark-text-secondary">
                      <span className="text-success mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Áreas de Mejora</h2>
                <ul className="space-y-2">
                  {evaluation.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2 text-dark-text-secondary">
                      <span className="text-error-light mt-1">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Observaciones */}
        {evaluation.observations && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Observaciones</h2>
            <p className="text-dark-text-secondary whitespace-pre-wrap">{evaluation.observations}</p>
          </div>
        )}
      </div>
    </div>
  );
}


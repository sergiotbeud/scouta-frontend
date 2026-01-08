'use client';

import { useAuthStore } from '../../../store/auth-store';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePlayers } from '../../../use-cases/usePlayers';
import { useEvaluations } from '../../../use-cases/useEvaluations';
import Link from 'next/link';
import { AxiosApiClient } from '../../../adapters/api/AxiosApiClient';
import { useAuthStore as useAuth } from '../../../store/auth-store';
import { Player } from '../../../domain/entities/Player';
import { Evaluation } from '../../../domain/entities/Evaluation';
import { AppHeader } from '../../../components/AppHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export default function PlayerDetailPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuth((state) => state.token);
  const router = useRouter();
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchPlayerEvaluations } = useEvaluations();
  const playerId = params.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!mounted || !isAuthenticated || !playerId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        if (token) {
          apiClient.setToken(token);
        }
        
        // Cargar jugador
        const playerResponse = await apiClient.getPlayerById(playerId);
        if (playerResponse.success && playerResponse.data) {
          setPlayer(playerResponse.data);
          
          // Cargar evaluaciones del jugador
          const playerEvaluations = await fetchPlayerEvaluations(playerId);
          if (playerEvaluations && Array.isArray(playerEvaluations)) {
            setEvaluations(playerEvaluations);
          }
        } else {
          setError(playerResponse.error || 'Error al cargar jugador');
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };

    if (mounted && isAuthenticated) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated, playerId, token]);

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
        <div className="text-white">Cargando jugador...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <AppHeader title="Scouta" subtitle="Jugadores" showBackButton={true} backUrl="/players" backLabel="Volver a Jugadores" />
        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="bg-error/20 border border-error/30 text-error-light px-6 py-4 rounded-xl">
            {error || 'Jugador no encontrado'}
          </div>
          <div className="mt-6">
            <Link
              href="/players"
              className="inline-flex items-center gap-2 px-6 py-3 bg-dark-elevated hover:bg-dark-hover text-white font-semibold rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a Jugadores
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <AppHeader title="Scouta" subtitle={`Detalle del Jugador: ${player.name}`} showBackButton={true} backUrl="/players" backLabel="Volver a Jugadores" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 mb-6">
          <Link
            href={`/players/${playerId}/edit`}
            className="px-4 py-2 text-sm bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 border border-primary-500/50 rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Link>
        </div>
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-3">
            {player.photoUrl ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${player.photoUrl}`}
                alt={player.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-dark-border shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-dark-elevated border-2 border-dark-border flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 bg-gradient-primary rounded-full"></div>
                <h2 className="text-4xl font-bold text-white">
                  {player.name}
                </h2>
              </div>
              <p className="text-dark-text-secondary font-light">
                {player.positions.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Player Info Card */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-white">
              Información del Jugador
            </h3>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span className="text-dark-text-secondary font-medium">Posición</span>
              </div>
              <span className="text-white font-semibold">
                {player.positions.join(', ')}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-dark-text-secondary font-medium">Edad</span>
              </div>
              <span className="text-white font-semibold">{player.age} años</span>
            </div>
            
            {player.height && (
              <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <span className="text-dark-text-secondary font-medium">Altura</span>
                </div>
                <span className="text-white font-semibold">{player.height}m</span>
              </div>
            )}
            
            {player.weight && (
              <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <span className="text-dark-text-secondary font-medium">Peso</span>
                </div>
                <span className="text-white font-semibold">{player.weight}kg</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information Card */}
        {(player.phone || player.email || player.eps || player.address) && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-8 shadow-2xl mb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-info-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white">
                Información de Contacto
              </h3>
            </div>
            
            <div className="space-y-1">
              {player.phone && (
                <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-dark-text-secondary font-medium">Teléfono</span>
                  </div>
                  <a href={`tel:${player.phone}`} className="text-white font-semibold hover:text-primary-400 transition-colors">
                    {player.phone}
                  </a>
                </div>
              )}
              
              {player.email && (
                <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-dark-text-secondary font-medium">Correo</span>
                  </div>
                  <a href={`mailto:${player.email}`} className="text-white font-semibold hover:text-primary-400 transition-colors">
                    {player.email}
                  </a>
                </div>
              )}
              
              {player.eps && (
                <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-dark-text-secondary font-medium">EPS</span>
                  </div>
                  <span className="text-white font-semibold">{player.eps}</span>
                </div>
              )}
              
              {player.address && (
                <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-dark-text-secondary font-medium">Dirección</span>
                  </div>
                  <span className="text-white font-semibold text-right max-w-xs">{player.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergency Contact Card */}
        {(player.emergencyContactName || player.emergencyContactPhone || player.emergencyContactRelation) && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-8 shadow-2xl mb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-warning-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white">
                Contacto de Emergencia
              </h3>
            </div>
            
            <div className="space-y-1">
              {player.emergencyContactName && (
                <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-dark-text-secondary font-medium">Nombre</span>
                  </div>
                  <span className="text-white font-semibold">{player.emergencyContactName}</span>
                </div>
              )}
              
              {player.emergencyContactPhone && (
                <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-dark-text-secondary font-medium">Teléfono</span>
                  </div>
                  <a href={`tel:${player.emergencyContactPhone}`} className="text-white font-semibold hover:text-primary-400 transition-colors">
                    {player.emergencyContactPhone}
                  </a>
                </div>
              )}
              
              {player.emergencyContactRelation && (
                <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-dark-text-secondary font-medium">Relación</span>
                  </div>
                  <span className="text-white font-semibold">{player.emergencyContactRelation}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evaluations Section */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-success-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white">
                Evaluaciones
              </h3>
            </div>
            <Link
              href={`/evaluations/new?playerId=${player.id}`}
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-success hover:opacity-95 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-success/30 text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Evaluación
            </Link>
          </div>
          
          {evaluations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-elevated flex items-center justify-center">
                <svg className="w-10 h-10 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-dark-text-secondary mb-4">
                Aún no hay evaluaciones registradas para este jugador
              </p>
              <Link
                href={`/evaluations/new?playerId=${player.id}`}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-success hover:opacity-95 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-success/30 text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Evaluar Jugador
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation, index) => {
                const evaluationDate = new Date(evaluation.date);
                const formattedDate = evaluationDate.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                
                // Comparar con la evaluación anterior
                const previousEvaluation = index < evaluations.length - 1 ? evaluations[index + 1] : null;
                let scoreChange: 'up' | 'down' | 'same' | null = null;
                let scoreDiff: number | null = null;
                
                if (evaluation.generalScore !== null && evaluation.generalScore !== undefined && 
                    previousEvaluation?.generalScore !== null && previousEvaluation?.generalScore !== undefined) {
                  scoreDiff = evaluation.generalScore - previousEvaluation.generalScore;
                  if (Math.abs(scoreDiff) < 0.1) {
                    scoreChange = 'same';
                  } else if (scoreDiff > 0) {
                    scoreChange = 'up';
                  } else {
                    scoreChange = 'down';
                  }
                }
                
                return (
                  <Link
                    key={evaluation.id}
                    href={`/evaluations/${evaluation.id}`}
                    className="block bg-dark-elevated border border-dark-border rounded-xl p-6 hover:bg-dark-hover transition-all duration-200 hover:border-success/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">
                              Evaluación del {formattedDate}
                            </h4>
                            <p className="text-sm text-dark-text-secondary">
                              {evaluation.items?.length || 0} items evaluados
                            </p>
                          </div>
                        </div>
                        {evaluation.generalScore !== null && evaluation.generalScore !== undefined && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-dark-text-secondary">Calificación General:</span>
                              <span className="text-lg font-bold text-success">
                                {evaluation.generalScore.toFixed(1)} / 5.0
                              </span>
                              {scoreChange && scoreDiff !== null && (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                                  scoreChange === 'up' 
                                    ? 'bg-success/20 text-success-light' 
                                    : scoreChange === 'down'
                                    ? 'bg-error/20 text-error-light'
                                    : 'bg-dark-text-tertiary/20 text-dark-text-secondary'
                                }`}>
                                  {scoreChange === 'up' && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                  )}
                                  {scoreChange === 'down' && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  )}
                                  {scoreChange === 'same' && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                    </svg>
                                  )}
                                  {scoreChange !== 'same' && (
                                    <span>{Math.abs(scoreDiff).toFixed(1)}</span>
                                  )}
                                  {scoreChange === 'same' && <span>Sin cambio</span>}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


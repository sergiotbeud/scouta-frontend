'use client';

import { useAuthStore } from '../../../store/auth-store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useEvaluations } from '../../../use-cases/useEvaluations';
import { usePlayers } from '../../../use-cases/usePlayers';
import { EvaluationForm } from '../../../components/EvaluationForm';
import { SubscriptionBlockedBanner } from '../../../components/SubscriptionBlockedBanner';
import Link from 'next/link';
import { ScoutaLogo } from '../../../components/ScoutaLogo';
import { useMySubscription } from '../../../use-cases/useMySubscription';

function NewEvaluationPageContent() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const { createEvaluation, isLoading, error } = useEvaluations();
  const { players, fetchPlayers } = usePlayers();
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
    if (mounted && isAuthenticated) {
      fetchPlayers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated]);

  // Cargar playerId desde query params si existe
  useEffect(() => {
    const playerIdParam = searchParams.get('playerId');
    if (playerIdParam) {
      setSelectedPlayerId(playerIdParam);
    }
  }, [searchParams]);

  const handleSubmit = async (data: { playerId: string; observations?: string | null; items: any[]; strengths?: string[]; weaknesses?: string[] }) => {
    if (!user) return;

    const result = await createEvaluation({
      playerId: data.playerId,
      evaluatorId: user.id,
      observations: data.observations || null,
      items: data.items,
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
    });

    if (result) {
      router.push(`/evaluations`);
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
      {/* Header */}
      <header className="bg-dark-surface/80 backdrop-blur-xl border-b border-dark-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <ScoutaLogo />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/evaluations"
                className="px-4 py-2 bg-dark-elevated hover:bg-dark-hover text-white rounded-xl font-semibold transition-all border border-dark-border"
              >
                Ver Evaluaciones
              </Link>
              <button
                onClick={() => {
                  useAuthStore.getState().clearAuth();
                  router.push('/login');
                }}
                className="px-4 py-2 bg-dark-elevated hover:bg-dark-hover text-white rounded-xl font-semibold transition-all border border-dark-border"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Nueva Evaluación</h1>
          <p className="text-dark-text-secondary">Evalúa las cualidades de un jugador</p>
        </div>

        {/* Selección de jugador */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl mb-6">
          <label className="block text-sm font-medium text-white mb-3">
            Seleccionar Jugador
          </label>
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success/50 transition-all [&>option]:bg-dark-elevated [&>option]:text-white"
          >
            <option value="">Selecciona un jugador...</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} - {Array.isArray(player.positions) ? player.positions.join(', ') : player.positions}
              </option>
            ))}
          </select>
        </div>

        {/* Formulario de evaluación */}
        <SubscriptionBlockedBanner />
        {selectedPlayerId && (() => {
          const selectedPlayer = players.find(p => p.id === selectedPlayerId);
          const playerPositions = selectedPlayer?.positions || [];
          return (
            <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl" style={{ pointerEvents: !isSubscriptionActive ? 'none' : 'auto', opacity: !isSubscriptionActive ? 0.5 : 1 }}>
              <EvaluationForm
                playerId={selectedPlayerId}
                playerPositions={Array.isArray(playerPositions) ? playerPositions : []}
                onSubmit={async (data) => {
                  await handleSubmit(data);
                }}
                isLoading={isLoading}
                error={error}
              />
            </div>
          );
        })()}

        {!selectedPlayerId && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl text-center">
            <p className="text-dark-text-secondary">Selecciona un jugador para comenzar la evaluación</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function NewEvaluationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <NewEvaluationPageContent />
    </Suspense>
  );
}


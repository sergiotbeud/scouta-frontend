'use client';

import { useAuthStore } from '../../../../store/auth-store';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useEvaluations } from '../../../../use-cases/useEvaluations';
import { usePlayers } from '../../../../use-cases/usePlayers';
import { EvaluationForm } from '../../../../components/EvaluationForm';
import Link from 'next/link';
import { AppHeader } from '../../../../components/AppHeader';
import { SubscriptionBlockedBanner } from '../../../../components/SubscriptionBlockedBanner';
import { Evaluation } from '../../../../domain/entities/Evaluation';
import { useMySubscription } from '../../../../use-cases/useMySubscription';

function EditEvaluationPageContent() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const { fetchEvaluationById, updateEvaluation, isLoading, error } = useEvaluations();
  const { subscription } = useMySubscription();
  const isSubscriptionActive = subscription?.status === 'ACTIVE';
  const { players, fetchPlayers } = usePlayers();
  const evaluationId = params.id as string;

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
      if (mounted && isAuthenticated && evaluationId) {
        await fetchPlayers();
        const evalData = await fetchEvaluationById(evaluationId);
        if (evalData) {
          setEvaluation(evalData);
        }
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated, evaluationId]);

  const handleSubmit = async (data: { playerId: string; observations?: string | null; items: any[]; strengths?: string[]; weaknesses?: string[] }) => {
    if (!user || !evaluation) return;

    const result = await updateEvaluation(evaluationId, {
      observations: data.observations || null,
      items: data.items,
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
    });

    if (result) {
      router.push(`/evaluations/${evaluationId}`);
    }
  };

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (isLoading && !evaluation) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando evaluación...</div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <AppHeader title="Scouta" subtitle="Evaluaciones" showBackButton={true} backUrl="/evaluations" backLabel="Volver a Evaluaciones" />
        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="bg-error/20 border border-error/30 text-error-light px-6 py-4 rounded-xl">
            Evaluación no encontrada
          </div>
        </main>
      </div>
    );
  }

  const player = players.find(p => p.id === evaluation.playerId);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <AppHeader title="Scouta" subtitle="Editar Evaluación" showBackButton={true} backUrl={`/evaluations/${evaluationId}`} backLabel="Volver a Evaluación" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <SubscriptionBlockedBanner />
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-gradient-primary rounded-full"></div>
            <div>
              <h2 className="text-4xl font-bold text-white mb-1.5">
                Editar Evaluación
              </h2>
              <p className="text-dark-text-secondary font-light">
                {player?.name || 'Jugador'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ pointerEvents: !isSubscriptionActive ? 'none' : 'auto', opacity: !isSubscriptionActive ? 0.5 : 1 }}>
          <EvaluationForm
            playerId={evaluation.playerId}
            playerPositions={player?.positions || []}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            initialData={evaluation}
          />
        </div>
      </main>
    </div>
  );
}

export default function EditEvaluationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <EditEvaluationPageContent />
    </Suspense>
  );
}


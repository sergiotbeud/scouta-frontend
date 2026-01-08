'use client';

import { useMySubscription } from '../use-cases/useMySubscription';
import { useAuthStore } from '../store/auth-store';
import { UserRole } from '../domain/entities/User';

export function SubscriptionBlockedBanner() {
  const user = useAuthStore((state) => state.user);
  const { subscription, isLoading } = useMySubscription();

  // Solo mostrar para ADMIN y EVALUATOR
  if (!user || user.role === UserRole.SUPER_ADMIN) {
    return null;
  }

  // No mostrar mientras carga
  if (isLoading) {
    return null;
  }

  // Si no hay suscripción o no está activa
  if (!subscription || subscription.status !== 'ACTIVE') {
    const statusMessage = !subscription 
      ? 'Suscripción requerida' 
      : subscription.status === 'INACTIVE' 
        ? 'Suscripción inactiva'
        : subscription.status === 'SUSPENDED'
          ? 'Suscripción suspendida'
          : subscription.status === 'CANCELLED'
            ? 'Suscripción cancelada'
            : subscription.status === 'GRACE_PERIOD'
              ? 'Período de gracia'
              : `Suscripción ${subscription.status}`;

    return (
      <div className="bg-error/20 border border-error/50 text-error-light px-6 py-4 rounded-xl mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-lg mb-1">
              {statusMessage}
            </p>
            <p className="text-sm opacity-90">
              Tu suscripción no está activa. No podrás crear, editar o eliminar jugadores, evaluaciones, evaluadores o templates.
            </p>
            <p className="text-sm mt-2 opacity-75">
              Por favor, contacta al Super Admin para activar tu suscripción.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}



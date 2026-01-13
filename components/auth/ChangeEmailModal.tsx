'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChangeEmail } from '../../use-cases/useChangeEmail';
import { useRouter } from 'next/navigation';

interface ChangeEmailModalProps {
  isOpen: boolean;
  isRequired?: boolean;
  currentEmail: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const changeEmailSchema = z.object({
  newEmail: z.string().email('El email no es válido'),
  confirmEmail: z.string().email('El email no es válido'),
}).refine((data) => data.newEmail === data.confirmEmail, {
  message: 'Los emails no coinciden',
  path: ['confirmEmail'],
}).refine((data) => !data.newEmail.endsWith('@scouta.local'), {
  message: 'No puedes usar un email generado. Por favor ingresa tu email real.',
  path: ['newEmail'],
});

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

export function ChangeEmailModal({ 
  isOpen, 
  isRequired = false,
  currentEmail,
  onSuccess, 
  onClose 
}: ChangeEmailModalProps) {
  const { changeEmail, isLoading, error } = useChangeEmail();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
  });

  if (!isOpen) return null;

  const onSubmit = async (data: ChangeEmailFormData) => {
    try {
      await changeEmail(data.newEmail);
      // Si llegamos aquí sin error, el cambio fue exitoso
      reset();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      // El error ya está manejado por useChangeEmail y se muestra en el estado error
      // No llamar onSuccess ni reset si hay error
    }
  };

  const handleClose = () => {
    if (!isRequired && onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-dark-elevated border border-dark-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isRequired ? 'Actualizar Email (Requerido)' : 'Cambiar Email'}
            </h2>
            <p className="text-sm text-dark-text-secondary mt-1">
              {isRequired
                ? 'Debes actualizar tu email antes de continuar. El email actual es generado automáticamente.'
                : 'Actualiza tu dirección de email'}
            </p>
          </div>
          {!isRequired && onClose && (
            <button
              onClick={handleClose}
              className="text-dark-text-secondary hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-elevated"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="bg-warning/20 border border-warning/30 rounded-xl p-4">
          <p className="text-warning-light text-sm">
            <strong>Email actual:</strong> {currentEmail}
          </p>
          <p className="text-warning-light text-xs mt-2">
            Por favor ingresa tu email real para poder acceder al sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium text-white mb-2">
              Nuevo Email
            </label>
            <input
              id="newEmail"
              type="email"
              {...register('newEmail')}
              className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="tu@email.com"
              disabled={isLoading}
            />
            {errors.newEmail && (
              <p className="mt-1 text-sm text-error-light">{errors.newEmail.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmEmail" className="block text-sm font-medium text-white mb-2">
              Confirmar Email
            </label>
            <input
              id="confirmEmail"
              type="email"
              {...register('confirmEmail')}
              className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="tu@email.com"
              disabled={isLoading}
            />
            {errors.confirmEmail && (
              <p className="mt-1 text-sm text-error-light">{errors.confirmEmail.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-error/20 border border-error/30 rounded-xl p-3">
              <p className="text-error-light text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-500/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Actualizando...' : 'Actualizar Email'}
            </button>
            {!isRequired && onClose && (
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-3 bg-dark-surface hover:bg-dark-hover text-white font-semibold rounded-xl transition-colors border border-dark-border"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}


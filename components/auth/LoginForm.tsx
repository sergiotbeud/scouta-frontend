'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '../../use-cases/useLogin';
import { ChangePasswordModal } from './ChangePasswordModal';
import { useAuthStore } from '../../store/auth-store';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, error } = useLogin();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [requiresCurrentPassword, setRequiresCurrentPassword] = useState(false);
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data.email, data.password);
    if (result?.mustChangePassword) {
      setRequiresCurrentPassword(false);
      setShowChangePasswordModal(true);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowChangePasswordModal(false);
    window.location.href = '/dashboard';
  };

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-white mb-2"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="w-full bg-dark-elevated border border-dark-border text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success transition-all duration-200 placeholder:text-dark-text-tertiary hover:border-dark-text-tertiary/50"
          placeholder="demo@ejemplo.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-2 text-sm text-error flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-white"
          >
            Contraseña
          </label>
          <a
            href="#"
            className="text-sm text-success hover:text-success-light transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <input
          id="password"
          type="password"
          {...register('password')}
          className="w-full bg-dark-elevated border border-dark-border text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success transition-all duration-200 placeholder:text-dark-text-tertiary hover:border-dark-text-tertiary/50"
          placeholder="••••••••"
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-2 text-sm text-error flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.password.message}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3.5 rounded-xl text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-success hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-success/30 transform hover:scale-[1.01] active:scale-[0.99]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Iniciando sesión...</span>
          </span>
        ) : (
          'Iniciar sesión'
        )}
      </button>
    </form>

    <ChangePasswordModal
      isOpen={showChangePasswordModal}
      requiresCurrentPassword={requiresCurrentPassword}
      isRequired={true}
      onSuccess={handlePasswordChangeSuccess}
    />
    </>
  );
}


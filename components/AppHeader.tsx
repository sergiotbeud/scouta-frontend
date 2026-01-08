'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../store/auth-store';
import { ScoutaLogo } from './ScoutaLogo';
import { UserRole } from '../domain/entities/User';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
  showQuickLinks?: boolean;
}

export function AppHeader({
  title = 'Scouta',
  subtitle,
  showBackButton = false,
  backUrl,
  backLabel = 'Volver',
  showQuickLinks = true,
}: AppHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <header className="bg-dark-surface/80 backdrop-blur-xl border-b border-dark-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y Título */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-4 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-success/20 flex items-center justify-center shadow-lg shadow-success/20">
                <ScoutaLogo size="sm" className="text-success" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-white">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-dark-text-secondary font-light line-clamp-1">{subtitle}</p>
                )}
              </div>
            </Link>
          </div>

          {/* Navegación Desktop */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-4">
            {/* Botón de retroceso */}
            {showBackButton && (
              <button
                onClick={handleBack}
                className="px-3 xl:px-4 py-2 text-xs xl:text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200 flex items-center gap-1 xl:gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden xl:inline">{backLabel}</span>
              </button>
            )}

            {/* Links rápidos */}
            {showQuickLinks && (
              <>
                <Link
                  href="/dashboard"
                  className="px-3 xl:px-4 py-2 text-xs xl:text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200"
                >
                  Dashboard
                </Link>
                {/* SUPER_ADMIN no puede ver jugadores ni evaluaciones */}
                {user && user.role !== UserRole.SUPER_ADMIN && (
                  <>
                    <Link
                      href="/players"
                      className="px-3 xl:px-4 py-2 text-xs xl:text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200"
                    >
                      Jugadores
                    </Link>
                    <Link
                      href="/evaluations"
                      className="px-3 xl:px-4 py-2 text-xs xl:text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200"
                    >
                      Evaluaciones
                    </Link>
                  </>
                )}
                {user && user.role === UserRole.ADMIN && (
                  <Link
                    href="/evaluators"
                    className="px-3 xl:px-4 py-2 text-xs xl:text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200"
                  >
                    Evaluadores
                  </Link>
                )}
              </>
            )}

            {/* Menú de usuario */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="text-right hidden xl:block">
                  <div className="text-sm font-medium text-white">{user.name}</div>
                  <div className="text-xs text-dark-text-secondary">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 xl:px-4 py-2 text-xs xl:text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200 flex items-center gap-1 xl:gap-2"
                  title="Cerrar Sesión"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden xl:inline">Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>

          {/* Botón Menú Móvil */}
          <div className="flex lg:hidden items-center gap-2">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="p-2 text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200"
                title={backLabel}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200"
                aria-label="Menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-dark-border/50">
            <div className="flex flex-col gap-2">
              {showQuickLinks && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200"
                  >
                    Dashboard
                  </Link>
                  {/* SUPER_ADMIN no puede ver jugadores ni evaluaciones */}
                  {user && user.role !== UserRole.SUPER_ADMIN && (
                    <>
                      <Link
                        href="/players"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-2 text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200"
                      >
                        Jugadores
                      </Link>
                      <Link
                        href="/evaluations"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-2 text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200"
                      >
                        Evaluaciones
                      </Link>
                    </>
                  )}
                  {user && user.role === UserRole.ADMIN && (
                    <Link
                      href="/evaluators"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200"
                    >
                      Evaluadores
                    </Link>
                  )}
                </>
              )}
              {user && (
                <>
                  <div className="px-4 py-2 border-t border-dark-border/30 mt-2 pt-2">
                    <div className="text-sm font-medium text-white mb-1">{user.name}</div>
                    <div className="text-xs text-dark-text-secondary">{user.role}</div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 text-sm text-dark-text-secondary hover:text-white hover:bg-dark-elevated rounded-lg transition-all duration-200 flex items-center gap-2 text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}


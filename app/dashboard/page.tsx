'use client';

import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDashboardStats } from '../../use-cases/useDashboardStats';
import { useMyClub } from '../../use-cases/useMyClub';
import { useMySubscription } from '../../use-cases/useMySubscription';
import Link from 'next/link';
import { AppHeader } from '../../components/AppHeader';
import dynamic from 'next/dynamic';
import { UserRole } from '../../domain/entities/User';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Importación dinámica para evitar problemas de SSR
const SuperAdminDashboard = dynamic(
  () => import('../../components/SuperAdminDashboard').then(mod => ({ default: mod.SuperAdminDashboard })),
  { ssr: false }
);

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { club, isLoading: clubLoading } = useMyClub();
  const { subscription, isLoading: subscriptionLoading } = useMySubscription();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
  
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <AppHeader title="Scouta" subtitle="Super Admin Dashboard" />
        <main className="container mx-auto px-6 py-8 max-w-7xl">
          <SuperAdminDashboard />
        </main>
      </div>
    );
  }

  // Dashboard normal para ADMIN y EVALUATOR
  return (
    <div className="min-h-screen bg-dark-bg">
      <AppHeader title="Scouta" subtitle="Dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-3">
            {/* Logo del Club y Foto del Usuario */}
            <div className="flex items-center gap-4">
              {/* Logo del Club */}
              {club && !clubLoading && (
                <div className="flex-shrink-0">
                  {club.logoUrl ? (
                    <img
                      src={club.logoUrl.startsWith('/') 
                        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${club.logoUrl}`
                        : club.logoUrl}
                      alt={`${club.name} logo`}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-dark-border shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-dark-elevated border-2 border-dark-border flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
              
              {/* Foto del Usuario (especialmente para evaluadores) */}
              {(user.role === UserRole.EVALUATOR || user.photoUrl) && (
                <div className="flex-shrink-0">
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl.startsWith('/') 
                        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${user.photoUrl}`
                        : user.photoUrl}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-500/50 shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-dark-elevated border-2 border-primary-500/50 flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 bg-gradient-primary rounded-full"></div>
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-1.5">
                    Bienvenido, {user.name}
                  </h2>
                  <p className="text-dark-text-secondary font-light">
                    {user.email}
                  </p>
                  {club && !clubLoading && (
                    <p className="text-primary-400 font-medium text-sm mt-1">
                      {club.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/players" className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl hover:border-primary-500/50 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? '...' : stats?.totalPlayers || 0}
            </div>
            <div className="text-sm text-dark-text-secondary">Total Jugadores</div>
            {stats && stats.activePlayers !== stats.totalPlayers && (
              <div className="text-xs text-dark-text-tertiary mt-1">
                {stats.activePlayers} activos
              </div>
            )}
          </Link>

          <Link href="/evaluations" className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl hover:border-success/50 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center group-hover:bg-success/30 transition-colors">
                <svg className="w-6 h-6 text-success-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? '...' : stats?.totalEvaluations || 0}
            </div>
            <div className="text-sm text-dark-text-secondary">Evaluaciones Totales</div>
            {stats && stats.evaluationsThisMonth > 0 && (
              <div className="text-xs text-success mt-1">
                {stats.evaluationsThisMonth} este mes
              </div>
            )}
          </Link>

          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-warning-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? '...' : stats?.evaluatedPlayers || 0}
            </div>
            <div className="text-sm text-dark-text-secondary">Jugadores Evaluados</div>
            {stats && stats.totalPlayers > 0 && (
              <div className="text-xs text-dark-text-tertiary mt-1">
                {stats.totalPlayers - stats.evaluatedPlayers} sin evaluar
              </div>
            )}
          </div>

          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-info-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? '...' : stats?.evaluationsThisMonth || 0}
            </div>
            <div className="text-sm text-dark-text-secondary">Evaluaciones Este Mes</div>
          </div>
        </div>

        {/* Error Message */}
        {statsError && (
          <div className="mb-6 bg-error/20 border border-error/30 text-error-light px-4 py-3 rounded-xl">
            {statsError}
          </div>
        )}

        {/* Charts */}
        {statsLoading ? (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-12 shadow-2xl mb-8 text-center">
            <div className="text-dark-text-secondary">Cargando estadísticas...</div>
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Distribución por Posición */}
            {Object.keys(stats.playersByPosition).length > 0 ? (
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Distribución por Posición</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.playersByPosition).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(stats.playersByPosition).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Distribución por Posición</h3>
                <div className="h-[300px] flex items-center justify-center text-dark-text-secondary">
                  No hay jugadores registrados
                </div>
              </div>
            )}

            {/* Evaluaciones por Mes */}
            {stats.evaluationsByMonth.length > 0 ? (
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Evaluaciones por Mes (Últimos 6 meses)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.evaluationsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Evaluaciones por Mes</h3>
                <div className="h-[300px] flex items-center justify-center text-dark-text-secondary">
                  No hay evaluaciones registradas
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Accesos Rápidos</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/evaluations/new"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-success hover:opacity-95 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-success/30 text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Nueva Evaluación
            </Link>
            <Link
              href="/evaluations"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-dark-elevated hover:bg-dark-hover text-white font-semibold rounded-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ver Evaluaciones
            </Link>
            <Link
              href="/players/new"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-dark-elevated hover:bg-dark-hover text-white font-semibold rounded-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Jugador
            </Link>
            <Link
              href="/players"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-dark-elevated hover:bg-dark-hover text-white font-semibold rounded-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Ver Todos los Jugadores
            </Link>
            {user.role === UserRole.ADMIN && (
              <Link
                href="/evaluators"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-dark-elevated hover:bg-dark-hover text-white font-semibold rounded-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Gestionar Evaluadores
              </Link>
            )}
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-white">
              Información del Usuario
            </h3>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30 last:border-0">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-dark-text-secondary font-medium">Nombre</span>
              </div>
              <span className="text-white font-medium">{user.name}</span>
            </div>
            
            <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30 last:border-0">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-dark-text-secondary font-medium">Rol</span>
              </div>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-primary-500/20 text-primary-400 border border-primary-500/30">
                {user.role}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-dark-text-secondary font-medium">Estado</span>
              </div>
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${
                user.isActive 
                  ? 'bg-success/20 text-success-light border border-success/30' 
                  : 'bg-error/20 text-error-light border border-error/30'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  user.isActive ? 'bg-success-light' : 'bg-error-light'
                }`}></span>
                {user.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {/* Información de Suscripción (solo para ADMIN) */}
            {user.role === UserRole.ADMIN && (
              <>
                {subscriptionLoading ? (
                  <div className="py-4 px-4 text-center text-dark-text-secondary">
                    Cargando información de suscripción...
                  </div>
                ) : subscription ? (
                  <>
                    <div className="pt-4 border-t border-dark-border/50">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Suscripción
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-dark-text-secondary text-sm">Plan</span>
                          <span className="text-white font-medium">{subscription.planType}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-dark-text-secondary text-sm">Estado</span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            subscription.status === 'ACTIVE'
                              ? 'bg-success/20 text-success-light border border-success/30'
                              : 'bg-error/20 text-error-light border border-error/30'
                          }`}>
                            {subscription.status === 'ACTIVE' ? 'Activa' : subscription.status}
                          </span>
                        </div>
                        {subscription.startDate && (
                          <div className="flex items-center justify-between py-2">
                            <span className="text-dark-text-secondary text-sm">Fecha de inicio</span>
                            <span className="text-white font-medium">
                              {new Date(subscription.startDate).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between py-2">
                          <span className="text-dark-text-secondary text-sm">Próxima renovación</span>
                          {subscription.nextPaymentDate ? (
                            <span className="text-white font-medium">
                              {new Date(subscription.nextPaymentDate).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          ) : (
                            <span className="text-dark-text-tertiary text-sm italic">
                              No disponible
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-dark-text-secondary text-sm">Máx. Jugadores</span>
                          <span className="text-white font-medium">{subscription.maxPlayers}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-dark-text-secondary text-sm">Máx. Evaluadores</span>
                          <span className="text-white font-medium">{subscription.maxEvaluators}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="pt-4 border-t border-dark-border/50">
                    <p className="text-dark-text-secondary text-sm text-center py-2">
                      No hay suscripción activa para este club
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


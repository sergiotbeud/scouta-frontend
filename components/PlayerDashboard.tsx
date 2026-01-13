'use client';

import { PlayerStats } from '../ports/IApiClient';
import { User } from '../domain/entities/User';
import { Club } from '../ports/IApiClient';
import { getImageUrl } from '../utils/imageUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AppHeader } from './AppHeader';
import Link from 'next/link';

interface PlayerDashboardProps {
  stats: PlayerStats | null;
  statsLoading: boolean;
  statsError: string | null;
  user: User;
  club: Club | null;
  clubLoading: boolean;
}

export function PlayerDashboard({ stats, statsLoading, statsError, user, club, clubLoading }: PlayerDashboardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <AppHeader title="Scouta" subtitle="Dashboard" />
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-6 mb-3">
            {/* Logo del Club y Foto del Usuario */}
            <div className="flex items-center gap-4">
              {/* Logo del Club */}
              {club && !clubLoading && (
                <div className="flex-shrink-0">
                  {club.logoUrl ? (
                    <img
                      src={getImageUrl(club.logoUrl) || ''}
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
              
              {/* Foto del Usuario */}
              {user.photoUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={getImageUrl(user.photoUrl) || ''}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-500/50 shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-1 h-6 sm:h-8 bg-gradient-primary rounded-full flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-1.5 break-words">
                    Bienvenido, {user.name}
                  </h2>
                  <p className="text-dark-text-secondary font-light text-xs sm:text-sm truncate">
                    {user.email}
                  </p>
                  {club && !clubLoading && (
                    <p className="text-primary-400 font-medium text-xs sm:text-sm mt-1 truncate">
                      {club.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-success-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {statsLoading ? '...' : stats?.totalEvaluations || 0}
            </div>
            <div className="text-xs sm:text-sm text-dark-text-secondary">Total Evaluaciones</div>
          </div>

          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {statsLoading ? '...' : stats?.lastEvaluationScore !== null && stats?.lastEvaluationScore !== undefined 
                ? `${stats.lastEvaluationScore.toFixed(1)} / 5.0`
                : 'N/A'}
            </div>
            <div className="text-xs sm:text-sm text-dark-text-secondary">Última Evaluación</div>
            {stats?.lastEvaluationDate && (
              <div className="text-xs text-dark-text-tertiary mt-1">
                {formatDate(stats.lastEvaluationDate)}
              </div>
            )}
          </div>

          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-warning-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {statsLoading ? '...' : stats?.averageGeneralScore !== null && stats?.averageGeneralScore !== undefined
                ? `${stats.averageGeneralScore.toFixed(1)} / 5.0`
                : 'N/A'}
            </div>
            <div className="text-xs sm:text-sm text-dark-text-secondary">Promedio General</div>
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
            {/* Evolución de Puntuaciones */}
            {stats.scoreEvolution && stats.scoreEvolution.length > 0 ? (
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Evolución de Puntuaciones</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.scoreEvolution.map(item => ({ ...item, date: item.date }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={(value) => formatShortDate(value)}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      domain={[0, 5]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelFormatter={(value) => formatDate(value)}
                      formatter={(value: number) => [`${value.toFixed(1)} / 5.0`, 'Puntuación']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Evolución de Puntuaciones</h3>
                <div className="h-[300px] flex items-center justify-center text-dark-text-secondary">
                  No hay suficientes evaluaciones para mostrar evolución
                </div>
              </div>
            )}

            {/* Evaluaciones por Categoría */}
            {Object.keys(stats.evaluationsByCategory).length > 0 ? (
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Promedio por Categoría</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(stats.evaluationsByCategory).map(([name, data]) => ({ name, average: data.average }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      domain={[0, 5]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)} / 5.0`, 'Promedio']}
                    />
                    <Bar dataKey="average" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Promedio por Categoría</h3>
                <div className="h-[300px] flex items-center justify-center text-dark-text-secondary">
                  No hay datos de categorías disponibles
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
              href="/evaluations"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-success hover:opacity-95 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-success/30 text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ver Mis Evaluaciones
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-dark-elevated hover:bg-dark-hover text-white font-semibold rounded-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mi Perfil
            </Link>
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
              Información del Perfil
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-dark-text-secondary font-medium">Correo electrónico</span>
              </div>
              <span className="text-white font-medium">{user.email}</span>
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
            
            <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200">
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
          </div>
        </div>
      </div>
    </div>
  );
}


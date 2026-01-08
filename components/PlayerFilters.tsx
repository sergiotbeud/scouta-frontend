'use client';

import { useState, useEffect } from 'react';
import { GetPlayersFilters } from '../ports/IApiClient';

interface PlayerFiltersProps {
  filters: GetPlayersFilters;
  onFiltersChange: (filters: GetPlayersFilters) => void;
  availablePositions: string[];
}

export function PlayerFilters({ filters, onFiltersChange, availablePositions }: PlayerFiltersProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedPositions, setSelectedPositions] = useState<string[]>(filters.positions || []);
  const [minAge, setMinAge] = useState<number | undefined>(filters.minAge);
  const [maxAge, setMaxAge] = useState<number | undefined>(filters.maxAge);
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'createdAt'>(filters.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sortOrder || 'desc');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        search: search.trim() || undefined,
        positions: selectedPositions.length > 0 ? selectedPositions : undefined,
        minAge: minAge !== undefined && minAge > 0 ? minAge : undefined,
        maxAge: maxAge !== undefined && maxAge > 0 ? maxAge : undefined,
        sortBy,
        sortOrder,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, selectedPositions, minAge, maxAge, sortBy, sortOrder]);

  const handlePositionToggle = (position: string) => {
    setSelectedPositions(prev =>
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedPositions([]);
    setMinAge(undefined);
    setMaxAge(undefined);
    setSortBy('createdAt');
    setSortOrder('desc');
    onFiltersChange({});
  };

  const hasActiveFilters = search.trim() || selectedPositions.length > 0 || minAge !== undefined || maxAge !== undefined || sortBy !== 'createdAt' || sortOrder !== 'desc';

  return (
    <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl mb-6">
      {/* Barra de búsqueda principal */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
        <div className="flex-1 relative">
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-text-tertiary pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-12 pr-12 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success/50 transition-all"
          />
          {search.trim() && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-text-tertiary hover:text-white transition-colors p-1"
              type="button"
              title="Limpiar búsqueda"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 sm:px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 text-sm ${
              showFilters || hasActiveFilters
                ? 'bg-success/20 text-success border border-success/30'
                : 'bg-dark-elevated text-dark-text-secondary hover:bg-dark-hover border border-dark-border'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-success text-white text-xs rounded-full">
                {[search.trim() && '1', selectedPositions.length, sortBy !== 'createdAt' && '1'].filter(Boolean).length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 sm:px-4 py-3 bg-dark-elevated hover:bg-dark-hover text-dark-text-secondary hover:text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 border border-dark-border text-sm"
              title="Limpiar todos los filtros"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="pt-4 border-t border-dark-border/50 space-y-4 animate-in slide-in-from-top-2">
          {/* Filtro por posiciones */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Posiciones
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {availablePositions.map((position) => {
                const isSelected = selectedPositions.includes(position);
                return (
                  <label
                    key={position}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer text-sm
                      ${
                        isSelected
                          ? 'bg-success/20 border-success/50 text-success'
                          : 'bg-dark-elevated border-dark-border text-white hover:bg-dark-hover'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handlePositionToggle(position)}
                      className="w-4 h-4 rounded border-dark-border bg-dark-elevated text-success focus:ring-2 focus:ring-success/50 cursor-pointer"
                    />
                    <span className="font-medium">{position}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Filtro por rango de edad */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Rango de Edad
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-dark-text-tertiary mb-1">
                  Edad mínima
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minAge || ''}
                  onChange={(e) => setMinAge(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Mínimo"
                  className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-text-tertiary mb-1">
                  Edad máxima
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={maxAge || ''}
                  onChange={(e) => setMaxAge(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Máximo"
                  className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Ordenamiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'age' | 'createdAt')}
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success/50 transition-all [&>option]:bg-dark-elevated [&>option]:text-white"
              >
                <option value="createdAt">Fecha de registro</option>
                <option value="name">Nombre</option>
                <option value="age">Edad</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Orden
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success/50 transition-all [&>option]:bg-dark-elevated [&>option]:text-white"
              >
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


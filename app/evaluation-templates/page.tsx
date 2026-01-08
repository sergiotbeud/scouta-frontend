'use client';

import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useEvaluationTemplates } from '../../use-cases/useEvaluationTemplates';
import { useMySubscription } from '../../use-cases/useMySubscription';
import Link from 'next/link';
import { AppHeader } from '../../components/AppHeader';
import { SubscriptionBlockedBanner } from '../../components/SubscriptionBlockedBanner';
import { EvaluationTemplate, CreateEvaluationTemplateRequest, UpdateEvaluationTemplateRequest } from '../../domain/entities/EvaluationTemplate';
import { EvaluationItemCategory, EvaluationItemDataType } from '../../domain/entities/Evaluation';

export default function EvaluationTemplatesPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { templates, isLoading, error, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } = useEvaluationTemplates();
  const { subscription } = useMySubscription();
  const isSubscriptionActive = subscription?.status === 'ACTIVE';
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EvaluationTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templatePosition, setTemplatePosition] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [customItems, setCustomItems] = useState<Record<EvaluationItemCategory, string[]>>({
    'técnico': [],
    'táctico': [],
    'físico': [],
    'cognitivo': [],
    'psicológico': [],
    'biomédico': [],
  });
  const [newItemInputs, setNewItemInputs] = useState<Record<EvaluationItemCategory, string>>({
    'técnico': '',
    'táctico': '',
    'físico': '',
    'cognitivo': '',
    'psicológico': '',
    'biomédico': '',
  });

  const availablePositions = [
    'Portero',
    'Defensor Central',
    'Lateral Izquierdo',
    'Lateral Derecho',
    'Mediocampista Defensivo',
    'Mediocampista Central',
    'Mediocampista Ofensivo',
    'Extremo Izquierdo',
    'Extremo Derecho',
    'Delantero Centro',
    'Segundo Delantero',
  ];

  // Items completos de evaluación (los mismos que en EvaluationForm)
  const evaluationItems: Record<EvaluationItemCategory, string[]> = {
    'técnico': [
      'Pases Totales', 'Pases Completados', 'Efectividad Pase (%)', 'Pases Progresivos', 'Pases Filtrados',
      'Pases Clave', 'Cambios de Orientación', 'Pases Largos Precisos', 'Pases al Área', 'Pases en Último Tercio',
      'Regates Intentados', 'Regates Exitosos', '1v1 Ofensivos Ganados', 'Conducciones Progresivas', 'Conducciones Largas',
      'Pérdidas por Conducción', 'Tiros Totales', 'Tiros a Puerta', 'xG', 'Remates de Cabeza',
      'Centros Totales', 'Centros Precisos', 'Primer Control Dirigido', 'Control Bajo Presión', 'Duelos Aéreos Ganados',
      'Duelos Técnicos Ganados', 'Asistencias', 'xA', 'Acciones de Gol Generadas', 'Participaciones en Secuencias de Gol',
      'Toques en Área Rival', 'Toques en Último Tercio',
    ],
    'táctico': [
      'Movilidad Entre Líneas', 'Desmarques de Ruptura', 'Apoyos Ofensivos', 'Participación en Construcción', 'Ocupación de Espacios',
      'Creación de Superioridades', 'Participación en Bloque Alto', 'Ejecución de Presión', 'PPDA Individual', 'Intercepciones',
      'Anticipaciones', 'Coberturas Defensivas', 'Repliegue Eficiente', 'Decisiones Correctas (%)', 'Presión Tras Pérdida',
      'Recuperaciones en Campo Rival', 'Recuperaciones Totales', 'Posición Media por Partido', 'Variación Posicional',
      'Ejecución en Transición Ofensiva', 'Ejecución en Transición Defensiva', 'Acciones Tácticas Erróneas', 'Errores No Forzados',
      'Disputas Tácticas Ganadas', 'Sincronización Colectiva', 'Participación en Triángulos', 'Secuencias Progresivas',
      'Presiones Exitosas', 'Cierres en Banda', 'Ocupación de Cuadrantes', 'Rupturas Sin Balón', 'Relación con Laterales',
    ],
    'físico': [
      'Velocidad Máxima', 'Velocidad Media', 'Sprints Totales', 'Distancia en Sprint', 'Distancia Total',
      'Alta Intensidad', 'Baja Intensidad', 'Aceleraciones (+)', 'Desaceleraciones', 'RSA Índice',
      'Tiempos Parciales (0–10m)', 'Tiempos Parciales (0–20m)', 'Potencia de Salto CMJ', 'Potencia SJ', 'Fuerza de Frenado',
      'Fuerza Excéntrica', 'Carga Externa GPS', 'Metros por Minuto', 'Índice de Fatiga', 'Recuperación Entre Esfuerzos',
      'Asimetrías Izquierda-Derecha', 'Golpes y Contactos', 'Estabilidad Core', 'Agilidad Test Illinois',
      'Reactividad Cambios de Dirección', 'Tolerancia a Esfuerzos', 'Dureza en Duelos', 'Capacidad Aeróbica',
      'Capacidad Anaeróbica', 'Umbral Anaeróbico', 'Consumo Estimado VO2',
    ],
    'cognitivo': [
      'Scans por Minuto', 'Scans Efectivos', 'Escaneo Previo a Pase', 'Escaneo Previo a Recepción', 'Anticipación Ofensiva',
      'Anticipación Defensiva', 'Tiempo de Decisión (ms)', 'Reconocimiento de Superioridades', 'Identificación de Líneas de Pase',
      'Adaptación en Espacios Reducidos', 'Creatividad Ofensiva', 'Variabilidad de Soluciones', 'Memoria de Juego',
      'Atención Distribuida', 'Atención Sostenida', 'Toma de Riesgos Controlada', 'Interpretación del Ritmo',
      'Capacidad de Predicción', 'Errores Cognitivos', 'Correctas Decisiones Bajo Presión (%)', 'Visión Periférica',
      'Escaneo en Zona Alta Presión', 'Tiempo de Reacción Visual', 'Tiempo de Reacción Auditivo', 'Solución en 2 Toques',
      'Ejecución Óptima', 'Consistencia Cognitiva', 'Concentración en Bloques', 'Respuestas en Transición',
      'Capacidad de Ajuste Táctico', 'Rapidez de Adaptación',
    ],
    'psicológico': [
      'Concentración', 'Atención Continua', 'Resiliencia', 'Manejo de Emoción', 'Liderazgo',
      'Comunicación', 'Actitud Competitiva', 'Confianza', 'Actuación Bajo Presión', 'Responsabilidad Táctica',
      'Compromiso', 'Intensidad Mental', 'Constancia', 'Estabilidad Emocional', 'Tolerancia a la Frustración',
      'Capacidad de Rebote Mental', 'Motivación Interna', 'Motivación Externa', 'Profesionalismo', 'Hábitos de Entrenamiento',
      'Trabajo en Equipo', 'Cooperación', 'Control de Impulsos', 'Autoregulación', 'Focalización',
      'Paciencia Táctica', 'Gestión del Error', 'Mental Toughness', 'Orden y Disciplina', 'Inteligencia Emocional',
      'Rendimiento en Crisis',
    ],
    'biomédico': [
      'FC Media', 'FC Máxima', 'Variabilidad HRV', 'Recuperación Post-Ejercicio', 'Carga Interna RPE',
      'Dolor Muscular', 'Fatiga Neuromuscular', 'Disponibilidad Física', 'Marcadores de Estrés', 'Sueño Diario (hrs)',
      'Calidad de Sueño', 'Riesgo de Lesión', 'Historial de Lesiones', 'Asimetría Muscular', 'Salud Articular',
      'Índice de Inflamación', 'Peso Corporal', 'Composición Corporal', 'Nivel de Hidratación', 'Gasto Energético',
      'HCM (Carga Muscular)', 'Ritmos Cardiacos Zonas', 'Tiempo en Zona 5', 'Tiempo en Zona 4', 'Oxigenación Tejidos',
      'Recuperación de 1 Minuto', 'Cansancio Reportado', 'Capacidad de Recuperar Día a Día', 'Microlesiones',
      'Carga Semanal Total', 'Carga Acumulada',
    ],
  };

  const categories: EvaluationItemCategory[] = ['técnico', 'táctico', 'físico', 'cognitivo', 'psicológico', 'biomédico'];
  const categoryLabels: Record<EvaluationItemCategory, string> = {
    'técnico': 'Técnico',
    'táctico': 'Táctico',
    'físico': 'Físico',
    'cognitivo': 'Cognitivo',
    'psicológico': 'Psicológico',
    'biomédico': 'Biomédico',
  };

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
      fetchTemplates(selectedPosition || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated, selectedPosition]);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este template? Esta acción no se puede deshacer.')) {
      await deleteTemplate(id);
    }
  };

  const handleCreateTemplate = () => {
    setTemplateName('');
    setTemplatePosition('');
    setSelectedItems({});
    setCustomItems({
      'técnico': [],
      'táctico': [],
      'físico': [],
      'cognitivo': [],
      'psicológico': [],
      'biomédico': [],
    });
    setNewItemInputs({
      'técnico': '',
      'táctico': '',
      'físico': '',
      'cognitivo': '',
      'psicológico': '',
      'biomédico': '',
    });
    setEditingTemplate(null);
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template: EvaluationTemplate) => {
    setTemplateName(template.name);
    setTemplatePosition(template.position);
    const itemsMap: Record<string, boolean> = {};
    const custom: Record<EvaluationItemCategory, string[]> = {
      'técnico': [],
      'táctico': [],
      'físico': [],
      'cognitivo': [],
      'psicológico': [],
      'biomédico': [],
    };
    
    template.items.forEach(item => {
      const key = `${item.category}:${item.itemName}`;
      // Verificar si el item es uno de los predefinidos
      if (evaluationItems[item.category].includes(item.itemName)) {
        itemsMap[key] = true;
      } else {
        // Es un item personalizado
        custom[item.category].push(item.itemName);
      }
    });
    
    setSelectedItems(itemsMap);
    setCustomItems(custom);
    setEditingTemplate(template);
    setShowCreateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templatePosition) {
      alert('Por favor completa el nombre y la posición del template');
      return;
    }

    // Combinar items predefinidos seleccionados y items personalizados
    const selectedItemsList = Object.entries(selectedItems)
      .filter(([_, selected]) => selected)
      .map(([key]) => {
        const [category, itemName] = key.split(':');
        return {
          category: category as EvaluationItemCategory,
          itemName,
          dataType: 'scale_1_5' as EvaluationItemDataType,
        };
      });

    // Agregar items personalizados
    categories.forEach(category => {
      customItems[category].forEach(itemName => {
        selectedItemsList.push({
          category,
          itemName,
          dataType: 'scale_1_5' as EvaluationItemDataType,
        });
      });
    });

    if (selectedItemsList.length === 0) {
      alert('Debes seleccionar o agregar al menos un item para el template');
      return;
    }

    if (editingTemplate) {
      const result = await updateTemplate(editingTemplate.id, {
        name: templateName.trim(),
        position: templatePosition,
        items: selectedItemsList,
      });
      if (result) {
        setShowCreateModal(false);
        setEditingTemplate(null);
      }
    } else {
      const result = await createTemplate({
        name: templateName.trim(),
        position: templatePosition,
        items: selectedItemsList,
      });
      if (result) {
        setShowCreateModal(false);
      }
    }
  };

  const toggleItem = (category: EvaluationItemCategory, itemName: string) => {
    const key = `${category}:${itemName}`;
    setSelectedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const addCustomItem = (category: EvaluationItemCategory) => {
    const itemName = newItemInputs[category].trim();
    if (!itemName) {
      return;
    }

    // Verificar que no exista ya (ni en predefinidos ni en personalizados)
    if (evaluationItems[category].includes(itemName)) {
      alert('Este item ya existe en la lista predefinida');
      return;
    }

    if (customItems[category].includes(itemName)) {
      alert('Este item personalizado ya existe');
      return;
    }

    setCustomItems(prev => ({
      ...prev,
      [category]: [...prev[category], itemName],
    }));

    // Seleccionar automáticamente el item personalizado
    const key = `${category}:${itemName}`;
    setSelectedItems(prev => ({
      ...prev,
      [key]: true,
    }));

    // Limpiar el input
    setNewItemInputs(prev => ({
      ...prev,
      [category]: '',
    }));
  };

  const removeCustomItem = (category: EvaluationItemCategory, itemName: string) => {
    setCustomItems(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item !== itemName),
    }));

    // Deseleccionar el item
    const key = `${category}:${itemName}`;
    setSelectedItems(prev => {
      const newItems = { ...prev };
      delete newItems[key];
      return newItems;
    });
  };

  const getItemsCount = (template: EvaluationTemplate): number => {
    return template.items?.length || 0;
  };

  const getItemsByCategory = (template: EvaluationTemplate): Record<string, number> => {
    const counts: Record<string, number> = {};
    template.items?.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
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
      <AppHeader title="Scouta" subtitle="Templates de Evaluación" showBackButton={true} backUrl="/evaluations" backLabel="Volver a Evaluaciones" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubscriptionBlockedBanner />
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Templates de Evaluación</h1>
            <p className="text-sm sm:text-base text-dark-text-secondary">
              Gestiona tus templates personalizados para evaluaciones. Máximo 3 templates por posición.
            </p>
          </div>
          <button
            onClick={handleCreateTemplate}
            disabled={!isSubscriptionActive}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-success text-white rounded-xl font-semibold transition-all duration-200 shadow-lg text-sm sm:text-base w-full sm:w-auto ${
              !isSubscriptionActive 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:opacity-95 hover:shadow-xl hover:shadow-success/30'
            }`}
            title={!isSubscriptionActive ? 'Suscripción inactiva' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Template
          </button>
        </div>

        {/* Filtro por posición */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl mb-6">
          <label className="block text-sm font-medium text-white mb-3">
            Filtrar por Posición
          </label>
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="w-full md:w-auto px-4 py-2 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-success/50"
          >
            <option value="">Todas las posiciones</option>
            {availablePositions.map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error/20 border border-error/30 text-error-light px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="text-dark-text-secondary">Cargando templates...</div>
          </div>
        )}

        {/* Templates List */}
        {!isLoading && templates.length === 0 && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-12 text-center">
            <p className="text-dark-text-secondary mb-4">
              {selectedPosition 
                ? `No tienes templates para la posición "${selectedPosition}"`
                : 'No tienes templates creados aún'}
            </p>
            <p className="text-dark-text-tertiary text-sm">
              Puedes crear templates desde el formulario de evaluación
            </p>
          </div>
        )}

        {!isLoading && templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const itemsByCategory = getItemsByCategory(template);
              return (
                <div
                  key={template.id}
                  className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl"
                >
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-1 truncate">{template.name}</h3>
                      <p className="text-xs sm:text-sm text-dark-text-secondary">{template.position}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        disabled={!isSubscriptionActive}
                        className={`transition-colors ${
                          !isSubscriptionActive
                            ? 'opacity-50 cursor-not-allowed text-dark-text-tertiary'
                            : 'text-success hover:text-success/80'
                        }`}
                        title={!isSubscriptionActive ? 'Suscripción inactiva' : 'Editar template'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        disabled={!isSubscriptionActive}
                        className={`transition-colors ${
                          !isSubscriptionActive
                            ? 'opacity-50 cursor-not-allowed text-dark-text-tertiary'
                            : 'text-error hover:text-error/80'
                        }`}
                        title={!isSubscriptionActive ? 'Suscripción inactiva' : 'Eliminar template'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-text-secondary">Total de items:</span>
                      <span className="text-white font-semibold">{getItemsCount(template)}</span>
                    </div>
                    <div className="pt-2 border-t border-dark-border">
                      <p className="text-xs text-dark-text-tertiary mb-2">Items por categoría:</p>
                      <div className="space-y-1">
                        {Object.entries(itemsByCategory).map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between text-xs">
                            <span className="text-dark-text-secondary capitalize">{category}:</span>
                            <span className="text-white">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <p className="text-xs text-dark-text-tertiary">
                      Creado: {new Date(template.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal para crear/editar template */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-dark-border rounded-3xl p-4 sm:p-6 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {editingTemplate ? 'Editar Template' : 'Crear Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTemplate(null);
                  }}
                  className="text-dark-text-secondary hover:text-white transition-colors p-1"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Nombre y posición */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Nombre del Template
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full px-4 py-2 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-success/50"
                      placeholder="Ej: Delantero Rápido"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Posición
                    </label>
                    <select
                      value={templatePosition}
                      onChange={(e) => setTemplatePosition(e.target.value)}
                      className="w-full px-4 py-2 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-success/50"
                    >
                      <option value="">Selecciona una posición</option>
                      {availablePositions.map(position => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selección de items por categoría */}
                <div>
                  <label className="block text-sm font-medium text-white mb-4">
                    Seleccionar Items ({Object.values(selectedItems).filter(Boolean).length} seleccionados)
                  </label>
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category} className="bg-dark-elevated border border-dark-border rounded-xl p-3 sm:p-4">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3">{categoryLabels[category]}</h3>
                        
                        {/* Items predefinidos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto mb-4">
                          {evaluationItems[category].map((itemName) => {
                            const key = `${category}:${itemName}`;
                            const isSelected = selectedItems[key] || false;
                            return (
                              <button
                                key={itemName}
                                type="button"
                                onClick={() => toggleItem(category, itemName)}
                                className={`px-3 py-2 rounded-lg text-sm text-left transition-all ${
                                  isSelected
                                    ? 'bg-success text-white border-2 border-success'
                                    : 'bg-dark-surface text-dark-text-secondary hover:bg-dark-hover border-2 border-dark-border'
                                }`}
                              >
                                {itemName}
                              </button>
                            );
                          })}
                        </div>

                        {/* Items personalizados de esta categoría */}
                        {customItems[category].length > 0 && (
                          <div className="mb-4 pt-4 border-t border-dark-border">
                            <p className="text-xs text-dark-text-tertiary mb-2">Items personalizados:</p>
                            <div className="flex flex-wrap gap-2">
                              {customItems[category].map((itemName) => {
                                const key = `${category}:${itemName}`;
                                const isSelected = selectedItems[key] || false;
                                return (
                                  <div key={itemName} className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleItem(category, itemName)}
                                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                                        isSelected
                                          ? 'bg-success text-white border-2 border-success'
                                          : 'bg-dark-surface text-dark-text-secondary hover:bg-dark-hover border-2 border-dark-border'
                                      }`}
                                    >
                                      {itemName}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeCustomItem(category, itemName)}
                                      className="text-error hover:text-error/80 transition-colors"
                                      title="Eliminar item personalizado"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Input para agregar item personalizado */}
                        <div className="pt-4 border-t border-dark-border">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={newItemInputs[category]}
                              onChange={(e) => setNewItemInputs(prev => ({ ...prev, [category]: e.target.value }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addCustomItem(category);
                                }
                              }}
                              placeholder={`Agregar item personalizado en ${categoryLabels[category]}`}
                              className="flex-1 px-4 py-2 bg-dark-surface border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => addCustomItem(category)}
                              className="px-4 py-2 bg-success hover:bg-success/90 text-white rounded-xl font-semibold transition-all text-sm whitespace-nowrap"
                            >
                              + Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-dark-border">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingTemplate(null);
                    }}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-dark-elevated hover:bg-dark-hover text-white rounded-xl font-semibold transition-all border border-dark-border text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={isLoading || !templateName.trim() || !templatePosition || Object.values(selectedItems).filter(Boolean).length === 0}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-success hover:bg-success/90 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isLoading ? 'Guardando...' : editingTemplate ? 'Actualizar Template' : 'Crear Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


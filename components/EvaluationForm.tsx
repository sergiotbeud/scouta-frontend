'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { EvaluationItemCategory } from '../domain/entities/Evaluation';
import { useEvaluationTemplates } from '../use-cases/useEvaluationTemplates';
import { EvaluationTemplate } from '../domain/entities/EvaluationTemplate';
import { useAuthStore } from '../store/auth-store';
import { Evaluation } from '../domain/entities/Evaluation';

const evaluationSchema = z.object({
  playerId: z.string().uuid('Debes seleccionar un jugador'),
  observations: z.string().optional().nullable(),
  strengths: z.string().optional().nullable(),
  weaknesses: z.string().optional().nullable(),
  items: z.array(z.object({
    category: z.string(),
    itemName: z.string(),
    value: z.number().min(1).max(5),
    dataType: z.literal('scale_1_5'),
  })).min(1, 'Debes completar al menos una evaluación'),
});

type EvaluationFormData = z.infer<typeof evaluationSchema>;

interface EvaluationFormProps {
  playerId?: string;
  playerPositions?: string[];
  onSubmit: (data: EvaluationFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  initialData?: Evaluation | null;
}

// Items de evaluación por categoría (lista completa)
const evaluationItems: Record<EvaluationItemCategory, string[]> = {
  'técnico': [
    'Pases Totales',
    'Pases Completados',
    'Efectividad Pase (%)',
    'Pases Progresivos',
    'Pases Filtrados',
    'Pases Clave',
    'Cambios de Orientación',
    'Pases Largos Precisos',
    'Pases al Área',
    'Pases en Último Tercio',
    'Regates Intentados',
    'Regates Exitosos',
    '1v1 Ofensivos Ganados',
    'Conducciones Progresivas',
    'Conducciones Largas',
    'Pérdidas por Conducción',
    'Tiros Totales',
    'Tiros a Puerta',
    'xG',
    'Remates de Cabeza',
    'Centros Totales',
    'Centros Precisos',
    'Primer Control Dirigido',
    'Control Bajo Presión',
    'Duelos Aéreos Ganados',
    'Duelos Técnicos Ganados',
    'Asistencias',
    'xA',
    'Acciones de Gol Generadas',
    'Participaciones en Secuencias de Gol',
    'Toques en Área Rival',
    'Toques en Último Tercio',
  ],
  'táctico': [
    'Movilidad Entre Líneas',
    'Desmarques de Ruptura',
    'Apoyos Ofensivos',
    'Participación en Construcción',
    'Ocupación de Espacios',
    'Creación de Superioridades',
    'Participación en Bloque Alto',
    'Ejecución de Presión',
    'PPDA Individual',
    'Intercepciones',
    'Anticipaciones',
    'Coberturas Defensivas',
    'Repliegue Eficiente',
    'Decisiones Correctas (%)',
    'Presión Tras Pérdida',
    'Recuperaciones en Campo Rival',
    'Recuperaciones Totales',
    'Posición Media por Partido',
    'Variación Posicional',
    'Ejecución en Transición Ofensiva',
    'Ejecución en Transición Defensiva',
    'Acciones Tácticas Erróneas',
    'Errores No Forzados',
    'Disputas Tácticas Ganadas',
    'Sincronización Colectiva',
    'Participación en Triángulos',
    'Secuencias Progresivas',
    'Presiones Exitosas',
    'Cierres en Banda',
    'Ocupación de Cuadrantes',
    'Rupturas Sin Balón',
    'Relación con Laterales',
  ],
  'físico': [
    'Velocidad Máxima',
    'Velocidad Media',
    'Sprints Totales',
    'Distancia en Sprint',
    'Distancia Total',
    'Alta Intensidad',
    'Baja Intensidad',
    'Aceleraciones (+)',
    'Desaceleraciones',
    'RSA Índice',
    'Tiempos Parciales (0–10m)',
    'Tiempos Parciales (0–20m)',
    'Potencia de Salto CMJ',
    'Potencia SJ',
    'Fuerza de Frenado',
    'Fuerza Excéntrica',
    'Carga Externa GPS',
    'Metros por Minuto',
    'Índice de Fatiga',
    'Recuperación Entre Esfuerzos',
    'Asimetrías Izquierda-Derecha',
    'Golpes y Contactos',
    'Estabilidad Core',
    'Agilidad Test Illinois',
    'Reactividad Cambios de Dirección',
    'Tolerancia a Esfuerzos',
    'Dureza en Duelos',
    'Capacidad Aeróbica',
    'Capacidad Anaeróbica',
    'Umbral Anaeróbico',
    'Consumo Estimado VO2',
  ],
  'cognitivo': [
    'Scans por Minuto',
    'Scans Efectivos',
    'Escaneo Previo a Pase',
    'Escaneo Previo a Recepción',
    'Anticipación Ofensiva',
    'Anticipación Defensiva',
    'Tiempo de Decisión (ms)',
    'Reconocimiento de Superioridades',
    'Identificación de Líneas de Pase',
    'Adaptación en Espacios Reducidos',
    'Creatividad Ofensiva',
    'Variabilidad de Soluciones',
    'Memoria de Juego',
    'Atención Distribuida',
    'Atención Sostenida',
    'Toma de Riesgos Controlada',
    'Interpretación del Ritmo',
    'Capacidad de Predicción',
    'Errores Cognitivos',
    'Correctas Decisiones Bajo Presión (%)',
    'Visión Periférica',
    'Escaneo en Zona Alta Presión',
    'Tiempo de Reacción Visual',
    'Tiempo de Reacción Auditivo',
    'Solución en 2 Toques',
    'Ejecución Óptima',
    'Consistencia Cognitiva',
    'Concentración en Bloques',
    'Respuestas en Transición',
    'Capacidad de Ajuste Táctico',
    'Rapidez de Adaptación',
  ],
  'psicológico': [
    'Concentración',
    'Atención Continua',
    'Resiliencia',
    'Manejo de Emoción',
    'Liderazgo',
    'Comunicación',
    'Actitud Competitiva',
    'Confianza',
    'Actuación Bajo Presión',
    'Responsabilidad Táctica',
    'Compromiso',
    'Intensidad Mental',
    'Constancia',
    'Estabilidad Emocional',
    'Tolerancia a la Frustración',
    'Capacidad de Rebote Mental',
    'Motivación Interna',
    'Motivación Externa',
    'Profesionalismo',
    'Hábitos de Entrenamiento',
    'Trabajo en Equipo',
    'Cooperación',
    'Control de Impulsos',
    'Autoregulación',
    'Focalización',
    'Paciencia Táctica',
    'Gestión del Error',
    'Mental Toughness',
    'Orden y Disciplina',
    'Inteligencia Emocional',
    'Rendimiento en Crisis',
  ],
  'biomédico': [
    'FC Media',
    'FC Máxima',
    'Variabilidad HRV',
    'Recuperación Post-Ejercicio',
    'Carga Interna RPE',
    'Dolor Muscular',
    'Fatiga Neuromuscular',
    'Disponibilidad Física',
    'Marcadores de Estrés',
    'Sueño Diario (hrs)',
    'Calidad de Sueño',
    'Riesgo de Lesión',
    'Historial de Lesiones',
    'Asimetría Muscular',
    'Salud Articular',
    'Índice de Inflamación',
    'Peso Corporal',
    'Composición Corporal',
    'Nivel de Hidratación',
    'Gasto Energético',
    'HCM (Carga Muscular)',
    'Ritmos Cardiacos Zonas',
    'Tiempo en Zona 5',
    'Tiempo en Zona 4',
    'Oxigenación Tejidos',
    'Recuperación de 1 Minuto',
    'Cansancio Reportado',
    'Capacidad de Recuperar Día a Día',
    'Microlesiones',
    'Carga Semanal Total',
    'Carga Acumulada',
  ],
};

export function EvaluationForm({ playerId, playerPositions = [], onSubmit, isLoading, error, initialData }: EvaluationFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<EvaluationItemCategory>('técnico');
  const [items, setItems] = useState<Record<string, { category: EvaluationItemCategory; itemName: string; value: number }>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [availableItems, setAvailableItems] = useState<Record<EvaluationItemCategory, string[]>>(evaluationItems);
  const [customItems, setCustomItems] = useState<Record<EvaluationItemCategory, string[]>>({
    'técnico': [],
    'táctico': [],
    'físico': [],
    'cognitivo': [],
    'psicológico': [],
    'biomédico': [],
  });
  // Estado para items ocultos (no se incluirán en la evaluación)
  const [hiddenItems, setHiddenItems] = useState<Record<EvaluationItemCategory, string[]>>({
    'técnico': [],
    'táctico': [],
    'físico': [],
    'cognitivo': [],
    'psicológico': [],
    'biomédico': [],
  });
  const [newItemInput, setNewItemInput] = useState<string>('');
  const { templates, fetchTemplates, createTemplate } = useEvaluationTemplates();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      playerId: playerId || '',
      observations: '',
      items: [],
    },
  });

  // Actualizar playerId cuando cambie la prop
  useEffect(() => {
    if (playerId) {
      setValue('playerId', playerId);
    }
  }, [playerId, setValue]);

  // Cargar datos iniciales si se está editando
  useEffect(() => {
    if (initialData) {
      setValue('playerId', initialData.playerId);
      setValue('observations', initialData.observations || '');
      // Cargar strengths y weaknesses como strings (unión de líneas)
      setValue('strengths', initialData.strengths?.join('\n') || '');
      setValue('weaknesses', initialData.weaknesses?.join('\n') || '');
      
      // Cargar items evaluados
      if (initialData.items && initialData.items.length > 0) {
        const initialItems: Record<string, { category: EvaluationItemCategory; itemName: string; value: number }> = {};
        const newCustomItems: Record<EvaluationItemCategory, string[]> = {
          'técnico': [],
          'táctico': [],
          'físico': [],
          'cognitivo': [],
          'psicológico': [],
          'biomédico': [],
        };
        const newAvailableItems: Record<EvaluationItemCategory, string[]> = {
          'técnico': [...evaluationItems['técnico']],
          'táctico': [...evaluationItems['táctico']],
          'físico': [...evaluationItems['físico']],
          'cognitivo': [...evaluationItems['cognitivo']],
          'psicológico': [...evaluationItems['psicológico']],
          'biomédico': [...evaluationItems['biomédico']],
        };
        
        // Crear un Set con los itemNames que SÍ están en la evaluación guardada
        const savedItemNames = new Set<string>();
        initialData.items.forEach(item => {
          const key = `${item.category}:${item.itemName}`;
          const value = typeof item.value === 'number' ? item.value : parseFloat(String(item.value)) || 0;
          
          // Solo agregar si el valor es válido (entre 1 y 5)
          if (value >= 1 && value <= 5) {
            savedItemNames.add(key);
            initialItems[key] = {
              category: item.category as EvaluationItemCategory,
              itemName: item.itemName,
              value: value,
            };
            
            // Si el item no está en la lista predefinida, agregarlo como personalizado
            if (!evaluationItems[item.category as EvaluationItemCategory].includes(item.itemName)) {
              if (!newCustomItems[item.category as EvaluationItemCategory].includes(item.itemName)) {
                newCustomItems[item.category as EvaluationItemCategory].push(item.itemName);
              }
              if (!newAvailableItems[item.category as EvaluationItemCategory].includes(item.itemName)) {
                newAvailableItems[item.category as EvaluationItemCategory].push(item.itemName);
              }
            }
          }
        });
        
        // Identificar items que estaban ocultos cuando se guardó
        // Los items ocultos son aquellos que están en availableItems pero NO están en savedItemNames
        const newHiddenItems: Record<EvaluationItemCategory, string[]> = {
          'técnico': [],
          'táctico': [],
          'físico': [],
          'cognitivo': [],
          'psicológico': [],
          'biomédico': [],
        };
        
        // Para cada categoría, encontrar items que están disponibles pero no fueron guardados
        (Object.keys(newAvailableItems) as EvaluationItemCategory[]).forEach(category => {
          newAvailableItems[category].forEach(itemName => {
            const key = `${category}:${itemName}`;
            // Si el item está en availableItems pero NO está en los items guardados, estaba oculto
            if (!savedItemNames.has(key)) {
              newHiddenItems[category].push(itemName);
            }
          });
        });
        
        // Actualizar estados
        setItems(initialItems);
        setCustomItems(newCustomItems);
        setAvailableItems(newAvailableItems);
        setHiddenItems(newHiddenItems);
        
        // Actualizar el formulario con todos los items
        const formItems = Object.values(initialItems).map((item) => ({
          category: item.category,
          itemName: item.itemName,
          value: item.value,
          dataType: 'scale_1_5' as const,
        }));
        setValue('items', formItems, { shouldValidate: true });
      }
    }
  }, [initialData, setValue]);

  // Cargar templates cuando cambien las posiciones del jugador
  // Solo cargar si hay token disponible (usuario autenticado)
  const token = useAuthStore((state) => state.token);
  useEffect(() => {
    if (playerPositions.length > 0 && token) {
      // Cargar templates para todas las posiciones del jugador
      Promise.all(
        playerPositions.map(position => fetchTemplates(position))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerPositions, token]);

  // Aplicar template cuando se seleccione uno
  // Solo aplicar si NO estamos editando (no hay initialData) o si el usuario cambia manualmente el template
  useEffect(() => {
    // Si hay initialData, no aplicar templates automáticamente para no perder datos
    if (initialData) {
      return;
    }
    
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        // Crear un objeto con los items del template organizados por categoría
        const templateItemsByCategory: Record<EvaluationItemCategory, string[]> = {
          'técnico': [],
          'táctico': [],
          'físico': [],
          'cognitivo': [],
          'psicológico': [],
          'biomédico': [],
        };
        
        template.items.forEach(item => {
          templateItemsByCategory[item.category].push(item.itemName);
        });
        
        setAvailableItems(templateItemsByCategory);
        // Limpiar items evaluados, personalizados y ocultos cuando se cambia de template
        setItems({});
        setCustomItems({
          'técnico': [],
          'táctico': [],
          'físico': [],
          'cognitivo': [],
          'psicológico': [],
          'biomédico': [],
        });
        setHiddenItems({
          'técnico': [],
          'táctico': [],
          'físico': [],
          'cognitivo': [],
          'psicológico': [],
          'biomédico': [],
        });
      }
    } else {
      // Si no hay template, usar todos los items definidos
      setAvailableItems(evaluationItems);
    }
  }, [selectedTemplateId, templates, initialData]);

  const addCustomItem = () => {
    const itemName = newItemInput.trim();
    if (!itemName) {
      return;
    }

    // Verificar que no exista ya (ni en predefinidos ni en personalizados)
    if (availableItems[selectedCategory].includes(itemName)) {
      alert('Este item ya existe en la lista');
      return;
    }

    if (customItems[selectedCategory].includes(itemName)) {
      alert('Este item personalizado ya existe');
      return;
    }

    setCustomItems(prev => ({
      ...prev,
      [selectedCategory]: [...prev[selectedCategory], itemName],
    }));

    // Agregar también a availableItems para que se muestre
    setAvailableItems(prev => ({
      ...prev,
      [selectedCategory]: [...prev[selectedCategory], itemName],
    }));

    // Limpiar el input
    setNewItemInput('');
  };

  const removeCustomItem = (itemName: string) => {
    setCustomItems(prev => ({
      ...prev,
      [selectedCategory]: prev[selectedCategory].filter(item => item !== itemName),
    }));

    // Remover de availableItems si no está en los predefinidos
    if (!evaluationItems[selectedCategory].includes(itemName)) {
      setAvailableItems(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory].filter(item => item !== itemName),
      }));
    }

    // Deseleccionar el item si estaba evaluado
    const key = `${selectedCategory}:${itemName}`;
    setItems(prev => {
      const newItems = { ...prev };
      delete newItems[key];
      return newItems;
    });
  };

  // Función para ocultar/mostrar un item
  const toggleItemVisibility = (itemName: string) => {
    setHiddenItems(prev => {
      const categoryHidden = prev[selectedCategory];
      const isHidden = categoryHidden.includes(itemName);
      
      return {
        ...prev,
        [selectedCategory]: isHidden
          ? categoryHidden.filter(item => item !== itemName)
          : [...categoryHidden, itemName]
      };
    });

    // Si se oculta un item que estaba evaluado, eliminarlo de items
    const key = `${selectedCategory}:${itemName}`;
    if (items[key]) {
      setItems(prev => {
        const newItems = { ...prev };
        delete newItems[key];
        return newItems;
      });
    }
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

  const handleItemChange = (itemName: string, value: number) => {
    // Guardar con la categoría actual
    const key = `${selectedCategory}:${itemName}`;
    const newItems = { ...items, [key]: { category: selectedCategory, itemName, value } };
    setItems(newItems);
    
    // Actualizar el array de items en el formulario
    const formItems = Object.values(newItems).map((item) => ({
      category: item.category,
      itemName: item.itemName,
      value: item.value,
      dataType: 'scale_1_5' as const,
    }));
    setValue('items', formItems, { shouldValidate: true });
  };

  const handleCategoryChange = (category: EvaluationItemCategory) => {
    setSelectedCategory(category);
  };

  const onSubmitForm = async (data: EvaluationFormData) => {
    // Construir items de todas las categorías desde el estado items
    // IMPORTANTE: Filtrar items ocultos - no deben incluirse en la evaluación
    const allItems = Object.values(items)
      .filter((item) => {
        // Verificar que el item no esté en la lista de ocultos de su categoría
        return !hiddenItems[item.category].includes(item.itemName);
      })
      .map((item) => ({
        category: item.category,
        itemName: item.itemName,
        value: item.value,
        dataType: 'scale_1_5' as const,
      }));

    // Convertir strengths y weaknesses de string a array
    const strengthsArray = data.strengths
      ? data.strengths.split('\n').filter(line => line.trim())
      : [];
    const weaknessesArray = data.weaknesses
      ? data.weaknesses.split('\n').filter(line => line.trim())
      : [];

    await onSubmit({
      ...data,
      items: allItems,
      strengths: strengthsArray,
      weaknesses: weaknessesArray,
    });
  };

  // Obtener templates disponibles para las posiciones del jugador
  const availableTemplates = templates.filter(template => 
    playerPositions.length === 0 || playerPositions.includes(template.position)
  );

  const handleSaveAsTemplate = async () => {
    if (!playerPositions || playerPositions.length === 0) {
      alert('Selecciona un jugador con posición para guardar como template');
      return;
    }

    const templateName = prompt('Nombre del template:');
    if (!templateName || !templateName.trim()) {
      return;
    }

    const position = playerPositions[0]; // Usar la primera posición
    const templateItems = Object.values(items).map(item => ({
      category: item.category,
      itemName: item.itemName,
      dataType: 'scale_1_5' as const,
    }));

    if (templateItems.length === 0) {
      alert('Debes evaluar al menos un item para guardar como template');
      return;
    }

    const result = await createTemplate({
      name: templateName.trim(),
      position,
      items: templateItems,
    });

    if (result) {
      alert('Template guardado correctamente');
      setSelectedTemplateId(result.id);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Selector de Template */}
      {playerPositions.length > 0 && (
        <div className="bg-dark-elevated border border-dark-border rounded-xl p-4 sm:p-6">
          <label className="block text-sm font-medium text-white mb-3">
            Usar Template (Opcional)
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="flex-1 w-full sm:w-auto px-4 py-2 bg-dark-surface border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-success/50 text-sm"
            >
              <option value="">Sin template (usar todos los items)</option>
              {availableTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.position}) - {template.items.length} items
                </option>
              ))}
            </select>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {Object.keys(items).length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAsTemplate}
                  className="flex-1 sm:flex-none px-4 py-2 bg-success/20 hover:bg-success/30 text-success border border-success/30 rounded-xl font-semibold transition-all text-sm whitespace-nowrap"
                >
                  Guardar como Template
                </button>
              )}
              <Link
                href="/evaluation-templates"
                className="flex-1 sm:flex-none px-4 py-2 bg-dark-surface hover:bg-dark-hover text-white border border-dark-border rounded-xl font-semibold transition-all text-sm text-center whitespace-nowrap"
              >
                Gestionar Templates
              </Link>
            </div>
          </div>
          {selectedTemplateId && (
            <p className="text-xs text-dark-text-secondary mt-2">
              Usando template: {templates.find(t => t.id === selectedTemplateId)?.name}
            </p>
          )}
        </div>
      )}

      {/* Selección de categoría */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Categoría de Evaluación
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                selectedCategory === category
                  ? 'bg-success text-white border-2 border-success'
                  : 'bg-dark-elevated text-dark-text-secondary hover:bg-dark-hover border-2 border-dark-border'
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </div>

      {/* Items de evaluación de la categoría seleccionada */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-white">
            {categoryLabels[selectedCategory]} - Evaluación (Escala 1-5)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemInput}
              onChange={(e) => setNewItemInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomItem();
                }
              }}
              placeholder="Agregar item personalizado"
              className="px-3 py-1.5 bg-dark-elevated border border-dark-border rounded-lg text-white text-sm placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50"
            />
            <button
              type="button"
              onClick={addCustomItem}
              className="px-3 py-1.5 bg-success hover:bg-success/90 text-white rounded-lg font-semibold text-sm transition-all"
            >
              + Agregar
            </button>
          </div>
        </div>
        
        {/* Botón para mostrar items ocultos */}
        {hiddenItems[selectedCategory].length > 0 && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => {
                // Mostrar todos los items ocultos
                setHiddenItems(prev => ({
                  ...prev,
                  [selectedCategory]: []
                }));
              }}
              className="text-xs text-dark-text-secondary hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Mostrar {hiddenItems[selectedCategory].length} item(s) oculto(s)
            </button>
          </div>
        )}

        <div className="space-y-4">
          {/* Filtrar items ocultos */}
          {availableItems[selectedCategory]
            .filter(itemName => !hiddenItems[selectedCategory].includes(itemName))
            .map((itemName) => {
            const isCustom = customItems[selectedCategory].includes(itemName) && !evaluationItems[selectedCategory].includes(itemName);
            return (
            <div key={itemName} className="bg-dark-elevated border border-dark-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{itemName}</span>
                  {isCustom && (
                    <span className="text-xs text-success bg-success/20 px-2 py-0.5 rounded">Personalizado</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-success text-sm font-semibold">
                    {items[`${selectedCategory}:${itemName}`]?.value || 'Sin evaluar'}
                  </span>
                  {/* Botón para ocultar item */}
                  <button
                    type="button"
                    onClick={() => toggleItemVisibility(itemName)}
                    className="text-dark-text-tertiary hover:text-error transition-colors"
                    title="Ocultar este item (no se incluirá en la evaluación)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => removeCustomItem(itemName)}
                      className="text-error hover:text-error/80 transition-colors"
                      title="Eliminar item personalizado"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const key = `${selectedCategory}:${itemName}`;
                  const isSelected = items[key]?.value === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleItemChange(itemName, value)}
                      className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                        isSelected
                          ? 'bg-success text-white border-2 border-success'
                          : 'bg-dark-surface text-dark-text-tertiary hover:bg-dark-hover border-2 border-dark-border'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Observaciones Generales
        </label>
        <textarea
          {...register('observations')}
          rows={4}
          className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success/50 transition-all resize-none"
          placeholder="Agrega observaciones generales sobre la evaluación..."
        />
      </div>

      {/* Fortalezas y Debilidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fortalezas */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            ✅ Fortalezas
          </label>
          <textarea
            {...register('strengths')}
            rows={4}
            className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success/50 transition-all resize-none"
            placeholder="Escribe cada fortaleza en una línea nueva..."
          />
          <p className="mt-2 text-xs text-dark-text-tertiary">
            Escribe cada fortaleza en una línea separada
          </p>
        </div>

        {/* Debilidades */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            ⚠️ Debilidades
          </label>
          <textarea
            {...register('weaknesses')}
            rows={4}
            className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-error/50 focus:border-error/50 transition-all resize-none"
            placeholder="Escribe cada debilidad en una línea nueva..."
          />
          <p className="mt-2 text-xs text-dark-text-tertiary">
            Escribe cada debilidad en una línea separada
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/20 border border-error/30 text-error-light px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Errores de validación */}
      {errors.items && (
        <div className="bg-error/20 border border-error/30 text-error-light px-4 py-3 rounded-xl">
          {errors.items.message}
        </div>
      )}

      {/* Resumen de items evaluados */}
      <div className="bg-dark-elevated border border-dark-border rounded-xl p-4">
        <p className="text-sm text-dark-text-secondary">
          Items evaluados: <span className="text-success font-semibold">
            {Object.values(items).filter((item) => !hiddenItems[item.category].includes(item.itemName)).length}
          </span>
          {Object.values(hiddenItems).flat().length > 0 && (
            <span className="text-dark-text-tertiary ml-2">
              ({Object.values(hiddenItems).flat().length} ocultos)
            </span>
          )}
        </p>
      </div>

      {/* Botón de envío */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading || Object.keys(items).length === 0}
          className="flex-1 px-6 py-3 bg-success hover:bg-success/90 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Guardando...' : 'Guardar Evaluación'}
        </button>
      </div>
    </form>
  );
}


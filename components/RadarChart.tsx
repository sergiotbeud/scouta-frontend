'use client';

import { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RadarChartData {
  category: string;
  value: number;
  fullMark?: number;
}

interface RadarChartProps {
  data: RadarChartData[];
  comparisonData?: RadarChartData[];
  maxValue?: number;
}

// Componente personalizado para el tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const category = payload[0].payload.category;
    const currentValue = payload.find((p: any) => p.name === 'Evaluación Actual')?.value;
    const previousValue = payload.find((p: any) => p.name === 'Evaluación Anterior')?.value;
    const maxValue = payload[0].payload.fullMark || 5;

    return (
      <div className="bg-dark-surface border border-dark-border rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{category}</p>
        {currentValue !== undefined && currentValue !== null && (
          <p className="text-sm" style={{ color: '#10B981' }}>
            Evaluación Actual: <span className="font-bold">{currentValue.toFixed(1)} / {maxValue}</span>
          </p>
        )}
        {previousValue !== undefined && previousValue !== null && (
          <p className="text-sm" style={{ color: '#3B82F6' }}>
            Evaluación Anterior: <span className="font-bold">{previousValue.toFixed(1)} / {maxValue}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function EvaluationRadarChart({ data, comparisonData, maxValue = 5 }: RadarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Combinar datos actuales y de comparación en un solo array
  const chartData = data.map((item, index) => {
    const comparisonItem = comparisonData?.[index];
    return {
      ...item,
      fullMark: maxValue,
      previousValue: comparisonItem?.value ?? null, // Usar null si no hay comparación
    };
  });

  if (!mounted) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-dark-elevated rounded-xl">
        <div className="text-dark-text-secondary">Cargando gráfico...</div>
      </div>
    );
  }

  // Solo mostrar comparación si hay datos de evaluación anterior
  const hasComparison = comparisonData && comparisonData.length > 0 && comparisonData.some(item => item.value > 0);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
            className="text-dark-text-secondary"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxValue]}
            tick={{ fill: '#6B7280', fontSize: 10 }}
            tickCount={6}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Evaluación Actual"
            dataKey="value"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.6}
            strokeWidth={2}
          />
          {hasComparison && (
            <Radar
              name="Evaluación Anterior"
              dataKey="previousValue"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          )}
          <Legend
            wrapperStyle={{ color: '#9CA3AF', fontSize: '14px' }}
            iconType="line"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

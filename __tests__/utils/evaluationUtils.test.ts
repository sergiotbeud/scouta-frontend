import {
  calculateCategoryAverage,
  getCategoryAverages,
  prepareRadarChartData,
  calculateStrengthsAndWeaknesses,
} from '../../utils/evaluationUtils';
import { Evaluation, EvaluationItemCategory } from '../../domain/entities/Evaluation';

describe('evaluationUtils', () => {
  const createMockEvaluation = (items: Array<{
    category: EvaluationItemCategory;
    itemName: string;
    value: number | string;
    dataType: string;
  }>): Evaluation => ({
    id: '1',
    playerId: 'player1',
    evaluatorId: 'evaluator1',
    date: '2024-01-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    items: items.map((item, index) => ({
      id: `item-${index}`,
      evaluationId: '1',
      category: item.category,
      itemName: item.itemName,
      value: item.value,
      dataType: item.dataType as any,
      createdAt: '2024-01-01T00:00:00Z',
    })),
  });

  describe('calculateCategoryAverage', () => {
    it('debe calcular el promedio de una categoría con valores scale_1_5', () => {
      const evaluation = createMockEvaluation([
        { category: 'técnico', itemName: 'Item 1', value: 3, dataType: 'scale_1_5' },
        { category: 'técnico', itemName: 'Item 2', value: 4, dataType: 'scale_1_5' },
        { category: 'técnico', itemName: 'Item 3', value: 5, dataType: 'scale_1_5' },
      ]);

      const average = calculateCategoryAverage(evaluation, 'técnico');
      expect(average).toBe(4.0);
    });

    it('debe retornar null si no hay items en la categoría', () => {
      const evaluation = createMockEvaluation([
        { category: 'táctico', itemName: 'Item 1', value: 3, dataType: 'scale_1_5' },
      ]);

      const average = calculateCategoryAverage(evaluation, 'técnico');
      expect(average).toBeNull();
    });

    it('debe normalizar valores de scale_1_10 a scale_1_5', () => {
      const evaluation = createMockEvaluation([
        { category: 'técnico', itemName: 'Item 1', value: 10, dataType: 'scale_1_10' },
        { category: 'técnico', itemName: 'Item 2', value: 1, dataType: 'scale_1_10' },
      ]);

      const average = calculateCategoryAverage(evaluation, 'técnico');
      expect(average).toBeCloseTo(3.0, 1);
    });

    it('debe normalizar valores de percentage a scale_1_5', () => {
      const evaluation = createMockEvaluation([
        { category: 'técnico', itemName: 'Item 1', value: 100, dataType: 'percentage' },
        { category: 'técnico', itemName: 'Item 2', value: 0, dataType: 'percentage' },
      ]);

      const average = calculateCategoryAverage(evaluation, 'técnico');
      expect(average).toBeCloseTo(3.0, 1);
    });

    it('debe manejar valores como strings JSON', () => {
      const evaluation = createMockEvaluation([
        { category: 'técnico', itemName: 'Item 1', value: '3', dataType: 'scale_1_5' },
        { category: 'técnico', itemName: 'Item 2', value: '4', dataType: 'scale_1_5' },
      ]);

      const average = calculateCategoryAverage(evaluation, 'técnico');
      expect(average).toBeCloseTo(3.5, 1);
    });
  });

  describe('getCategoryAverages', () => {
    it('debe calcular promedios para todas las categorías', () => {
      const evaluation = createMockEvaluation([
        { category: 'técnico', itemName: 'Item 1', value: 3, dataType: 'scale_1_5' },
        { category: 'táctico', itemName: 'Item 2', value: 4, dataType: 'scale_1_5' },
        { category: 'físico', itemName: 'Item 3', value: 5, dataType: 'scale_1_5' },
      ]);

      const averages = getCategoryAverages(evaluation);
      expect(averages.técnico).toBe(3.0);
      expect(averages.táctico).toBe(4.0);
      expect(averages.físico).toBe(5.0);
      expect(averages.cognitivo).toBeNull();
      expect(averages.psicológico).toBeNull();
      expect(averages.biomédico).toBeNull();
    });
  });

  describe('prepareRadarChartData', () => {
    it('debe preparar datos para el gráfico radar', () => {
      const evaluation = createMockEvaluation([
        { category: 'técnico', itemName: 'Item 1', value: 3, dataType: 'scale_1_5' },
        { category: 'táctico', itemName: 'Item 2', value: 4, dataType: 'scale_1_5' },
      ]);

      const result = prepareRadarChartData(evaluation);
      expect(result.data).toHaveLength(6);
      expect(result.data[0]).toEqual({ category: 'Técnico', value: 3.0 });
      expect(result.data[1]).toEqual({ category: 'Táctico', value: 4.0 });
      expect(result.comparisonData).toBeUndefined();
    });

    it('debe incluir datos de comparación si se proporciona evaluación previa', () => {
      const current = createMockEvaluation([
        { category: 'técnico', itemName: 'Item 1', value: 4, dataType: 'scale_1_5' },
      ]);
      const previous = createMockEvaluation([
        { category: 'técnico', itemName: 'Item 1', value: 3, dataType: 'scale_1_5' },
      ]);

      const result = prepareRadarChartData(current, previous);
      expect(result.comparisonData).toBeDefined();
      expect(result.comparisonData?.[0].value).toBe(3.0);
    });
  });

  describe('calculateStrengthsAndWeaknesses', () => {
    it('debe identificar fortalezas (>= 4.0)', () => {
      const evaluation = createMockEvaluation([
        { category: 'técnico', itemName: 'Item 1', value: 5, dataType: 'scale_1_5' },
        { category: 'táctico', itemName: 'Item 2', value: 4.5, dataType: 'scale_1_5' },
        { category: 'físico', itemName: 'Item 3', value: 4, dataType: 'scale_1_5' },
        { category: 'cognitivo', itemName: 'Item 4', value: 3.5, dataType: 'scale_1_5' },
      ]);

      const result = calculateStrengthsAndWeaknesses(evaluation);
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.strengths[0].average).toBeGreaterThanOrEqual(4.0);
    });

    it('debe identificar debilidades (< 3.0)', () => {
      const evaluation = createMockEvaluation([
        { category: 'técnico', itemName: 'Item 1', value: 2.5, dataType: 'scale_1_5' },
        { category: 'táctico', itemName: 'Item 2', value: 2, dataType: 'scale_1_5' },
        { category: 'físico', itemName: 'Item 3', value: 3.5, dataType: 'scale_1_5' },
      ]);

      const result = calculateStrengthsAndWeaknesses(evaluation);
      expect(result.weaknesses.length).toBeGreaterThan(0);
      expect(result.weaknesses[0].average).toBeLessThan(3.0);
    });
  });
});

import { Evaluation, EvaluationItemCategory } from '../domain/entities/Evaluation';

export function calculateCategoryAverage(evaluation: Evaluation, category: EvaluationItemCategory): number | null {
  const categoryItems = evaluation.items?.filter(item => item.category === category) || [];
  if (categoryItems.length === 0) {
    return null;
  }

  let itemsToProcess = categoryItems.filter(item => item.dataType === 'scale_1_5');
  
  if (itemsToProcess.length === 0) {
    itemsToProcess = categoryItems.filter(item => 
      ['scale_1_5', 'scale_1_10', 'numeric', 'percentage'].includes(item.dataType)
    );
    
    if (itemsToProcess.length === 0) {
      return null;
    }
  }

  const numericValues: number[] = [];
  
  itemsToProcess.forEach(item => {
    let value = item.value;
    
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        value = typeof parsed === 'number' ? parsed : parseFloat(value);
      } catch {
        value = parseFloat(value);
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      if ('value' in value && typeof (value as any).value === 'number') {
        value = (value as any).value;
      } else if ('number' in value && typeof (value as any).number === 'number') {
        value = (value as any).number;
      } else {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue !== 0) {
          value = numValue;
        } else {
          return;
        }
      }
    }
    
    if (typeof value !== 'number' || isNaN(value)) {
      return;
    }
    
    let normalizedValue = value;
    
    if (item.dataType === 'scale_1_10' && value >= 1 && value <= 10) {
      normalizedValue = ((value - 1) / 9) * 4 + 1;
    }
    else if (item.dataType === 'percentage' && value >= 0 && value <= 100) {
      normalizedValue = ((value / 100) * 4) + 1;
    }
    else if (item.dataType === 'numeric') {
      if (value > 5 || value < 1) {
        if (value > 0 && value <= 10) {
          normalizedValue = ((value - 1) / 9) * 4 + 1;
        } else if (value > 0 && value <= 100) {
          normalizedValue = ((value / 100) * 4) + 1;
        }
      }
    }
    
    if (normalizedValue >= 1 && normalizedValue <= 5) {
      numericValues.push(normalizedValue);
    }
  });

  if (numericValues.length === 0) {
    return null;
  }

  const average = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
  const result = parseFloat(average.toFixed(1));
  
  return result;
}

export function getCategoryAverages(evaluation: Evaluation): Record<EvaluationItemCategory, number | null> {
  const categories: EvaluationItemCategory[] = ['técnico', 'táctico', 'físico', 'cognitivo', 'psicológico', 'biomédico'];
  const averages: Record<string, number | null> = {};
  
  categories.forEach(category => {
    averages[category] = calculateCategoryAverage(evaluation, category);
  });
  
  return averages as Record<EvaluationItemCategory, number | null>;
}

export function prepareRadarChartData(evaluation: Evaluation, previousEvaluation?: Evaluation) {
  const categories: EvaluationItemCategory[] = ['técnico', 'táctico', 'físico', 'cognitivo', 'psicológico', 'biomédico'];
  const categoryLabels: Record<EvaluationItemCategory, string> = {
    'técnico': 'Técnico',
    'táctico': 'Táctico',
    'físico': 'Físico',
    'cognitivo': 'Cognitivo',
    'psicológico': 'Psicológico',
    'biomédico': 'Biomédico',
  };

  const currentAverages = getCategoryAverages(evaluation);
  
  const data = categories.map(category => ({
    category: categoryLabels[category],
    value: currentAverages[category] || 0,
  }));

  let comparisonData: typeof data | undefined;
  if (previousEvaluation) {
    const previousAverages = getCategoryAverages(previousEvaluation);
    comparisonData = categories.map(category => ({
      category: categoryLabels[category],
      value: previousAverages[category] || 0,
    }));
  }

  return { data, comparisonData };
}

export function calculateStrengthsAndWeaknesses(evaluation: Evaluation): {
  strengths: { category: EvaluationItemCategory; average: number }[];
  weaknesses: { category: EvaluationItemCategory; average: number }[];
} {
  const averages = getCategoryAverages(evaluation);
  const categories: EvaluationItemCategory[] = ['técnico', 'táctico', 'físico', 'cognitivo', 'psicológico', 'biomédico'];
  
  const categoryAverages = categories
    .map(category => ({
      category,
      average: averages[category],
    }))
    .filter(item => item.average !== null) as { category: EvaluationItemCategory; average: number }[];
  
  categoryAverages.sort((a, b) => b.average - a.average);
  
  const strengths = categoryAverages
    .filter(item => item.average >= 4.0)
    .slice(0, 3);
  
  const weaknesses = [...categoryAverages]
    .reverse()
    .filter(item => item.average < 3.0)
    .slice(0, 3);
  
  return { strengths, weaknesses };
}


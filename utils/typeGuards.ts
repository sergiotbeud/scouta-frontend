/**
 * Type guards para validar tipos en tiempo de ejecución
 */

/**
 * Type guard para verificar si un error es un error de Axios
 */
export function isAxiosError(error: unknown): error is {
  response?: {
    status?: number;
    data?: {
      error?: string;
      details?: Array<{
        path?: string[];
        message?: string;
      }>;
    };
  };
  request?: unknown;
  message?: string;
} {
  return (
    error !== null &&
    typeof error === 'object' &&
    ('response' in error || 'request' in error || 'message' in error)
  );
}

/**
 * Type guard para verificar si un error tiene detalles de validación
 */
export function hasValidationDetails(error: unknown): error is {
  response: {
    data: {
      details: Array<{
        path?: string[];
        message?: string;
      }>;
    };
  };
} {
  return (
    isAxiosError(error) &&
    error.response?.data?.details !== undefined &&
    Array.isArray(error.response.data.details)
  );
}

/**
 * Type guard para verificar si un valor es un objeto con una propiedad específica
 */
export function hasProperty<T extends string>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    prop in obj
  );
}

/**
 * Type guard para verificar si un valor es un objeto con propiedades numéricas
 */
export function isNumericObject(value: unknown): value is {
  value?: number;
  number?: number;
} {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  return (
    ('value' in obj && typeof obj.value === 'number') ||
    ('number' in obj && typeof obj.number === 'number')
  );
}

/**
 * Type guard para verificar si un valor es un array de items de evaluación
 */
export function isEvaluationItemsArray(items: unknown): items is Array<{
  category?: string;
  itemName?: string;
  value?: unknown;
  dataType?: string;
  createdAt?: string;
}> {
  return Array.isArray(items);
}

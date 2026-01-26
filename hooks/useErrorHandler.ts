import { useCallback } from 'react';
import { parseApiError, extractValidationErrors, isConnectionError, isAuthError } from '../utils/errorUtils';

/**
 * Hook para centralizar el manejo de errores en use-cases
 * 
 * @returns Objeto con funciones helper para manejar errores
 */
export function useErrorHandler() {
  /**
   * Maneja un error y retorna un mensaje de error legible
   * 
   * @param error - El error a manejar
   * @param defaultMessage - Mensaje por defecto si no se puede extraer uno del error
   * @returns Mensaje de error legible
   */
  const handleError = useCallback((error: unknown, defaultMessage: string = 'Ha ocurrido un error'): string => {
    const errorMessage = parseApiError(error, defaultMessage);
    
    // Log en desarrollo para debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error manejado:', {
        error,
        errorMessage,
        isConnectionError: isConnectionError(error),
        isAuthError: isAuthError(error),
        validationErrors: extractValidationErrors(error),
      });
    }
    
    return errorMessage;
  }, []);

  /**
   * Maneja un error y retorna tanto el mensaje como los detalles de validación
   * 
   * @param error - El error a manejar
   * @param defaultMessage - Mensaje por defecto si no se puede extraer uno del error
   * @returns Objeto con el mensaje de error y los detalles de validación (si existen)
   */
  const handleErrorWithDetails = useCallback(
    (error: unknown, defaultMessage: string = 'Ha ocurrido un error') => {
      const errorMessage = parseApiError(error, defaultMessage);
      const validationErrors = extractValidationErrors(error);
      
      return {
        message: errorMessage,
        validationErrors,
        isConnectionError: isConnectionError(error),
        isAuthError: isAuthError(error),
      };
    },
    []
  );

  return {
    handleError,
    handleErrorWithDetails,
    parseApiError,
    extractValidationErrors,
    isConnectionError,
    isAuthError,
  };
}

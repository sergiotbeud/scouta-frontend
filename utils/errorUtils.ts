/**
 * Utilidades para el manejo de errores de la API
 */

import { isAxiosError, hasValidationDetails } from './typeGuards';

/**
 * Parsea un error desconocido y retorna un mensaje de error legible
 * 
 * @param error - El error a parsear (puede ser de cualquier tipo)
 * @param defaultMessage - Mensaje por defecto si no se puede extraer uno del error
 * @returns Mensaje de error legible
 */
export function parseApiError(error: unknown, defaultMessage: string = 'Ha ocurrido un error'): string {
  // Si es un string, retornarlo directamente
  if (typeof error === 'string') {
    return error;
  }

  // Si es un objeto Error con mensaje
  if (error instanceof Error && error.message) {
    return error.message;
  }

  // Si es una respuesta de Axios con datos de error
  if (isAxiosError(error)) {
    // Error de validación con detalles
    if (hasValidationDetails(error)) {
      const validationErrors = error.response.data.details
        .map((detail) => {
          const path = detail.path?.join('.') || 'campo';
          return `${path}: ${detail.message || 'Error de validación'}`;
        })
        .join(', ');
      return `Error de validación: ${validationErrors}`;
    }
    
    // Error con mensaje en response.data.error
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    // Error de conexión
    if (error.request && !error.response) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
    }
    
    // Error HTTP con código de estado
    if (error.response?.status) {
      const status = error.response.status;
      if (status === 401) {
        return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      }
      if (status === 403) {
        return 'No tienes permisos para realizar esta acción.';
      }
      if (status === 404) {
        return 'Recurso no encontrado.';
      }
      if (status === 500) {
        return 'Error interno del servidor. Por favor, intenta más tarde.';
      }
      return `Error del servidor (${status})`;
    }
  }

  // Si tiene un mensaje genérico
  if (error && typeof error === 'object' && 'message' in error) {
    const errorWithMessage = error as { message: unknown };
    if (typeof errorWithMessage.message === 'string') {
      return errorWithMessage.message;
    }
  }

  // Mensaje por defecto
  return defaultMessage;
}

/**
 * Extrae detalles de validación de un error de API
 * 
 * @param error - El error a analizar
 * @returns Array de mensajes de validación o null si no hay detalles
 */
export function extractValidationErrors(error: unknown): string[] | null {
  if (hasValidationDetails(error)) {
    return error.response.data.details.map((detail) => {
      const path = detail.path?.join('.') || 'campo';
      return `${path}: ${detail.message || 'Error de validación'}`;
    });
  }
  return null;
}

/**
 * Verifica si un error es un error de conexión (sin respuesta del servidor)
 * 
 * @param error - El error a verificar
 * @returns true si es un error de conexión
 */
export function isConnectionError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'request' in error) {
    const axiosError = error as any;
    return !!axiosError.request && !axiosError.response;
  }
  return false;
}

/**
 * Verifica si un error es un error de autenticación (401)
 * 
 * @param error - El error a verificar
 * @returns true si es un error 401
 */
export function isAuthError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.response?.status === 401;
  }
  return false;
}

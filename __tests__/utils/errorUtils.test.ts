import {
  parseApiError,
  extractValidationErrors,
  isConnectionError,
  isAuthError,
} from '../../utils/errorUtils';

describe('errorUtils', () => {
  describe('parseApiError', () => {
    it('debe retornar el mensaje si el error es un string', () => {
      const error = 'Error de prueba';
      expect(parseApiError(error)).toBe('Error de prueba');
    });

    it('debe retornar el mensaje si el error es un Error', () => {
      const error = new Error('Error de prueba');
      expect(parseApiError(error)).toBe('Error de prueba');
    });

    it('debe retornar el mensaje de error del API response', () => {
      const error = {
        response: {
          data: {
            error: 'Error del servidor',
          },
        },
      };
      expect(parseApiError(error)).toBe('Error del servidor');
    });

    it('debe retornar mensaje de validación si hay detalles', () => {
      const error = {
        response: {
          data: {
            details: [
              { path: ['name'], message: 'Name is required' },
              { path: ['email'], message: 'Email is invalid' },
            ],
          },
        },
      };
      const result = parseApiError(error);
      expect(result).toContain('Error de validación');
      expect(result).toContain('name');
      expect(result).toContain('email');
    });

    it('debe retornar mensaje de conexión si no hay response', () => {
      const error = {
        request: {},
      };
      const result = parseApiError(error);
      expect(result).toContain('No se pudo conectar');
    });

    it('debe retornar mensaje específico para error 401', () => {
      const error = {
        response: {
          status: 401,
        },
      };
      expect(parseApiError(error)).toContain('Sesión expirada');
    });

    it('debe retornar mensaje específico para error 403', () => {
      const error = {
        response: {
          status: 403,
        },
      };
      expect(parseApiError(error)).toContain('No tienes permisos');
    });

    it('debe retornar mensaje específico para error 404', () => {
      const error = {
        response: {
          status: 404,
        },
      };
      expect(parseApiError(error)).toContain('Recurso no encontrado');
    });

    it('debe retornar mensaje específico para error 500', () => {
      const error = {
        response: {
          status: 500,
        },
      };
      expect(parseApiError(error)).toContain('Error interno del servidor');
    });

    it('debe retornar el mensaje por defecto si no se puede parsear', () => {
      const error = {};
      expect(parseApiError(error, 'Error por defecto')).toBe('Error por defecto');
    });
  });

  describe('extractValidationErrors', () => {
    it('debe extraer errores de validación de un error de API', () => {
      const error = {
        response: {
          data: {
            details: [
              { path: ['name'], message: 'Name is required' },
              { path: ['email'], message: 'Email is invalid' },
            ],
          },
        },
      };
      const errors = extractValidationErrors(error);
      expect(errors).toEqual([
        'name: Name is required',
        'email: Email is invalid',
      ]);
    });

    it('debe retornar null si no hay detalles de validación', () => {
      const error = {
        response: {
          data: {
            error: 'Some error',
          },
        },
      };
      expect(extractValidationErrors(error)).toBeNull();
    });

    it('debe retornar null si no hay response', () => {
      const error = {
        message: 'Error',
      };
      expect(extractValidationErrors(error)).toBeNull();
    });
  });

  describe('isConnectionError', () => {
    it('debe retornar true para un error de conexión', () => {
      const error = {
        request: {},
      };
      expect(isConnectionError(error)).toBe(true);
    });

    it('debe retornar false si hay response', () => {
      const error = {
        request: {},
        response: {
          status: 404,
        },
      };
      expect(isConnectionError(error)).toBe(false);
    });

    it('debe retornar false si no hay request', () => {
      const error = {
        message: 'Error',
      };
      expect(isConnectionError(error)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('debe retornar true para un error 401', () => {
      const error = {
        response: {
          status: 401,
        },
      };
      expect(isAuthError(error)).toBe(true);
    });

    it('debe retornar false para otros códigos de estado', () => {
      const error = {
        response: {
          status: 404,
        },
      };
      expect(isAuthError(error)).toBe(false);
    });

    it('debe retornar false si no hay response', () => {
      const error = {
        message: 'Error',
      };
      expect(isAuthError(error)).toBe(false);
    });
  });
});

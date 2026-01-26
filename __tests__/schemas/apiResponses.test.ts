import {
  UserSchema,
  PlayerSchema,
  ApiResponsePlayerSchema,
  ApiResponsePlayersSchema,
  validateApiResponse,
  safeValidateApiResponse,
} from '../../schemas/apiResponses';

describe('apiResponses schemas', () => {
  describe('UserSchema', () => {
    it('debe validar un usuario válido', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        photoUrl: null,
        role: 'ADMIN',
        isActive: true,
        mustChangePassword: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      expect(() => UserSchema.parse(user)).not.toThrow();
    });

    it('debe rechazar un usuario con email inválido', () => {
      const user = {
        id: '123',
        email: 'invalid-email',
        name: 'Test User',
        photoUrl: null,
        role: 'ADMIN',
        isActive: true,
        mustChangePassword: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      expect(() => UserSchema.parse(user)).toThrow();
    });

    it('debe rechazar un usuario con role inválido', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        photoUrl: null,
        role: 'INVALID_ROLE',
        isActive: true,
        mustChangePassword: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      expect(() => UserSchema.parse(user)).toThrow();
    });
  });

  describe('PlayerSchema', () => {
    it('debe validar un jugador válido', () => {
      const player = {
        id: '123',
        name: 'Test Player',
        positions: ['Delantero'],
        age: 25,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      expect(() => PlayerSchema.parse(player)).not.toThrow();
    });

    it('debe validar un jugador con campos opcionales', () => {
      const player = {
        id: '123',
        name: 'Test Player',
        positions: ['Delantero'],
        age: 25,
        height: 180,
        weight: 75,
        email: 'player@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      expect(() => PlayerSchema.parse(player)).not.toThrow();
    });

    it('debe rechazar un jugador sin campos requeridos', () => {
      const player = {
        id: '123',
        // Falta name
        positions: ['Delantero'],
        age: 25,
      };
      expect(() => PlayerSchema.parse(player)).toThrow();
    });
  });

  describe('ApiResponsePlayerSchema', () => {
    it('debe validar una respuesta exitosa con datos', () => {
      const response = {
        success: true,
        data: {
          id: '123',
          name: 'Test Player',
          positions: ['Delantero'],
          age: 25,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      expect(() => ApiResponsePlayerSchema.parse(response)).not.toThrow();
    });

    it('debe validar una respuesta de error', () => {
      const response = {
        success: false,
        error: 'Error message',
      };
      expect(() => ApiResponsePlayerSchema.parse(response)).not.toThrow();
    });
  });

  describe('ApiResponsePlayersSchema', () => {
    it('debe validar una respuesta con array de jugadores', () => {
      const response = {
        success: true,
        data: [
          {
            id: '123',
            name: 'Test Player',
            positions: ['Delantero'],
            age: 25,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      };
      expect(() => ApiResponsePlayersSchema.parse(response)).not.toThrow();
    });
  });

  describe('validateApiResponse', () => {
    it('debe retornar datos validados', () => {
      const data = {
        success: true,
        data: {
          id: '123',
          name: 'Test Player',
          positions: ['Delantero'],
          age: 25,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      const result = validateApiResponse(data, ApiResponsePlayerSchema);
      expect(result).toEqual(data);
    });

    it('debe lanzar error si la validación falla', () => {
      const data = {
        success: true,
        data: {
          // Datos inválidos
          id: 123, // Debe ser string
        },
      };
      expect(() => validateApiResponse(data, ApiResponsePlayerSchema)).toThrow();
    });
  });

  describe('safeValidateApiResponse', () => {
    it('debe retornar datos validados', () => {
      const data = {
        success: true,
        data: {
          id: '123',
          name: 'Test Player',
          positions: ['Delantero'],
          age: 25,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      const result = safeValidateApiResponse(data, ApiResponsePlayerSchema);
      expect(result).toEqual(data);
    });

    it('debe retornar null si la validación falla', () => {
      const data = {
        success: true,
        data: {
          // Datos inválidos
          id: 123, // Debe ser string
        },
      };
      const result = safeValidateApiResponse(data, ApiResponsePlayerSchema);
      expect(result).toBeNull();
    });
  });
});

import { z } from 'zod';

/**
 * Schemas de Zod para validar respuestas del API
 * Estos schemas aseguran que las respuestas del backend tengan la estructura esperada
 */

// Schema para User
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EVALUATOR', 'PLAYER']),
  isActive: z.boolean(),
  mustChangePassword: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Schema para Player
export const PlayerSchema = z.object({
  id: z.string(),
  clubId: z.string().optional(),
  userId: z.string().nullable().optional(),
  name: z.string(),
  photoUrl: z.string().nullable().optional(),
  positions: z.array(z.string()),
  age: z.number(),
  height: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  biometricData: z.record(z.unknown()).nullable().optional(),
  contactInfo: z.record(z.unknown()).nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  eps: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  emergencyContactRelation: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Schema para EvaluationItem
export const EvaluationItemSchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  category: z.enum(['técnico', 'táctico', 'físico', 'cognitivo', 'psicológico', 'biomédico', 'vad', 'vao']),
  itemName: z.string(),
  value: z.unknown(), // Puede ser number, string, object, etc.
  dataType: z.enum(['numeric', 'percentage', 'scale_1_5', 'scale_1_10', 'index', 'coordinate']),
  createdAt: z.string(),
});

// Schema para Evaluation
export const EvaluationSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  evaluatorId: z.string(),
  date: z.string(),
  observations: z.string().nullable().optional(),
  generalScore: z.number().nullable().optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  videoUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(EvaluationItemSchema).optional(),
  player: PlayerSchema.nullable().optional(),
  evaluator: UserSchema.nullable().optional(),
});

// Schema para Club
export const ClubSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  role: z.string().optional(),
});

// Schema para Subscription
export const SubscriptionSchema = z.object({
  id: z.string(),
  clubId: z.string(),
  planType: z.enum(['FOUNDER', 'STANDARD']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED', 'GRACE_PERIOD']),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  lastPaymentDate: z.string().nullable().optional(),
  nextPaymentDate: z.string().nullable().optional(),
  maxPlayers: z.number(),
  maxEvaluators: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Schema para UploadPhotoResponse
export const UploadPhotoResponseSchema = z.object({
  photoUrl: z.string(),
  filename: z.string(),
});

// Schema para DashboardStats
export const DashboardStatsSchema = z.object({
  totalPlayers: z.number(),
  activePlayers: z.number(),
  totalEvaluations: z.number(),
  evaluationsThisMonth: z.number(),
  averageGeneralScore: z.number().nullable(),
  evaluatedPlayers: z.number(),
  playersByPosition: z.record(z.number()),
  evaluationsByMonth: z.array(z.object({
    month: z.string(),
    count: z.number(),
  })),
});

// Schema para PlayerStats
export const PlayerStatsSchema = z.object({
  totalEvaluations: z.number(),
  lastEvaluationDate: z.string().nullable(),
  lastEvaluationScore: z.number().nullable(),
  averageGeneralScore: z.number().nullable(),
  evaluationsThisMonth: z.number(),
  scoreEvolution: z.array(z.object({
    date: z.string(),
    score: z.number(),
  })),
  evaluationsByCategory: z.record(z.object({
    average: z.number(),
    count: z.number(),
  })),
});

// Schema para SharedReport
export const SharedReportSchema = z.object({
  id: z.string(),
  token: z.string(),
  evaluationId: z.string(),
  createdBy: z.string(),
  expiresAt: z.string().nullable().optional(),
  maxViews: z.number().nullable().optional(),
  viewCount: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  shareUrl: z.string().optional(),
});

// Schema para SharedReportInfo
export const SharedReportInfoSchema = z.object({
  token: z.string(),
  viewCount: z.number(),
  maxViews: z.number().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

// Schema para PlayerWithoutPassword
export const PlayerWithoutPasswordSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  clubId: z.string(),
  clubName: z.string(),
  userId: z.string().nullable(),
  hasPassword: z.boolean(),
  mustChangePassword: z.boolean(),
});

// Schema para GeneratePasswordResponse
export const GeneratePasswordResponseSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  email: z.string().email(),
  generatedPassword: z.string(),
  userId: z.string(),
  clubName: z.string(),
});

// Schema genérico para ApiResponse
export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    details: z.unknown().optional(),
  });
}

// Schemas específicos para respuestas comunes
export const ApiResponsePlayerSchema = createApiResponseSchema(PlayerSchema);
export const ApiResponsePlayersSchema = createApiResponseSchema(z.array(PlayerSchema));
export const ApiResponseUserSchema = createApiResponseSchema(UserSchema);
export const ApiResponseUsersSchema = createApiResponseSchema(z.array(UserSchema));
export const ApiResponseEvaluationSchema = createApiResponseSchema(EvaluationSchema);
export const ApiResponseEvaluationsSchema = createApiResponseSchema(z.array(EvaluationSchema));
export const ApiResponseClubSchema = createApiResponseSchema(ClubSchema);
export const ApiResponseClubsSchema = createApiResponseSchema(z.array(ClubSchema));
export const ApiResponseSubscriptionSchema = createApiResponseSchema(SubscriptionSchema);
export const ApiResponseUploadPhotoSchema = createApiResponseSchema(UploadPhotoResponseSchema);
export const ApiResponseDashboardStatsSchema = createApiResponseSchema(DashboardStatsSchema);
export const ApiResponsePlayerStatsSchema = createApiResponseSchema(PlayerStatsSchema);
export const ApiResponseSharedReportSchema = createApiResponseSchema(SharedReportSchema);
export const ApiResponsePlayerWithoutPasswordSchema = createApiResponseSchema(z.array(PlayerWithoutPasswordSchema));
export const ApiResponseGeneratePasswordSchema = createApiResponseSchema(GeneratePasswordResponseSchema);

// Schema para LoginResponse
export const LoginResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    user: UserSchema,
    token: z.string(),
    mustChangePassword: z.boolean(),
    mustChangeEmail: z.boolean(),
  }).optional(),
  error: z.string().optional(),
  details: z.unknown().optional(),
});

// Schema para ChangePasswordResponse y ChangeEmailResponse
export const ChangePasswordResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    message: z.string(),
  }).optional(),
  error: z.string().optional(),
  details: z.unknown().optional(),
});

export const ChangeEmailResponseSchema = ChangePasswordResponseSchema;

/**
 * Valida una respuesta del API usando un schema de Zod
 * @param data - Los datos a validar
 * @param schema - El schema de Zod a usar
 * @returns Los datos validados
 * @throws Error si la validación falla
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: z.ZodType<T>
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = `Error de validación del API: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error de validación del API:', {
          errors: error.errors,
          data,
        });
      }
      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * Valida una respuesta del API de forma segura (no lanza error, retorna null si falla)
 * @param data - Los datos a validar
 * @param schema - El schema de Zod a usar
 * @returns Los datos validados o null si la validación falla
 */
export function safeValidateApiResponse<T>(
  data: unknown,
  schema: z.ZodType<T>
): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Advertencia de validación del API:', {
          errors: error.errors,
          data,
        });
      }
      return null;
    }
    return null;
  }
}

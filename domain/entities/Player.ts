export interface Player {
  id: string;
  clubId?: string; // ID del club al que pertenece el jugador
  userId?: string | null;
  name: string;
  photoUrl?: string | null;
  positions: string[]; // Array de posiciones
  age: number;
  height?: number | null;
  weight?: number | null;
  biometricData?: Record<string, any> | null;
  contactInfo?: Record<string, any> | null;
  phone?: string | null;
  email?: string | null;
  eps?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  deletedAt?: string | null; // Fecha de eliminación (soft delete)
  createdAt: string;
  updatedAt: string;
}


export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EVALUATOR = 'EVALUATOR',
  PLAYER = 'PLAYER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}




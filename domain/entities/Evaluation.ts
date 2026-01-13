import { Player } from './Player';
import { User } from './User';

export type EvaluationItemDataType = 'numeric' | 'percentage' | 'scale_1_5' | 'scale_1_10' | 'index' | 'coordinate';
export type EvaluationItemCategory = 'técnico' | 'táctico' | 'físico' | 'cognitivo' | 'psicológico' | 'biomédico';

export interface EvaluationItem {
  id: string;
  evaluationId: string;
  category: EvaluationItemCategory;
  itemName: string;
  value: any;
  dataType: EvaluationItemDataType;
  createdAt: string;
}

export interface Evaluation {
  id: string;
  playerId: string;
  evaluatorId: string;
  date: string;
  observations?: string | null;
  generalScore?: number | null;
  strengths?: string[];
  weaknesses?: string[];
  createdAt: string;
  updatedAt: string;
  items?: EvaluationItem[];
  player?: Player | null; // Información del jugador incluida en la respuesta
  evaluator?: User | null; // Información del evaluador incluida en la respuesta
}



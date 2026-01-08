import { EvaluationItemCategory, EvaluationItemDataType } from './Evaluation';

export interface EvaluationTemplateItem {
  category: EvaluationItemCategory;
  itemName: string;
  dataType: EvaluationItemDataType;
}

export interface EvaluationTemplate {
  id: string;
  evaluatorId: string;
  name: string;
  position: string;
  items: EvaluationTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluationTemplateRequest {
  name: string;
  position: string;
  items: EvaluationTemplateItem[];
}

export interface UpdateEvaluationTemplateRequest {
  name?: string;
  position?: string;
  items?: EvaluationTemplateItem[];
}




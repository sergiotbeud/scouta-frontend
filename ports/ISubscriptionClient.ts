import { Subscription, CreateSubscriptionRequest, UpdateSubscriptionRequest, ApiResponse } from './IApiClient';

/**
 * Interfaz para operaciones relacionadas con suscripciones
 */
export interface ISubscriptionClient {
  getSubscriptionByClubId(clubId: string): Promise<ApiResponse<Subscription>>;
  getMySubscription(): Promise<ApiResponse<Subscription>>;
  createSubscription(clubId: string, subscription: CreateSubscriptionRequest): Promise<ApiResponse<Subscription>>;
  updateSubscription(clubId: string, subscription: UpdateSubscriptionRequest): Promise<ApiResponse<Subscription>>;
}

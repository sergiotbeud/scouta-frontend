import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import { AxiosApiClient } from '../../adapters/api/AxiosApiClient';
import { IApiClient } from '../../ports/IApiClient';
import { IAuthClient } from '../../ports/IAuthClient';
import { IPlayerClient } from '../../ports/IPlayerClient';
import { IEvaluationClient } from '../../ports/IEvaluationClient';
import { IClubClient } from '../../ports/IClubClient';
import { ISubscriptionClient } from '../../ports/ISubscriptionClient';
import { IReportClient } from '../../ports/IReportClient';
import { IEvaluatorClient } from '../../ports/IEvaluatorClient';
import { IAdminClient } from '../../ports/IAdminClient';
import { IAuthStore } from '../../ports/IAuthStore';
import { ZustandAuthStore } from '../../adapters/store/ZustandAuthStore';

// Obtener API URL desde variables de entorno
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Registrar IAuthStore con implementación ZustandAuthStore como singleton
container.register<IAuthStore>('IAuthStore', {
  useClass: ZustandAuthStore,
});

// Función factory para crear AxiosApiClient
const createApiClient = (c: DependencyContainer): AxiosApiClient => {
  const authStore = c.resolve<IAuthStore>('IAuthStore');
  return new AxiosApiClient(API_URL, authStore);
};

// Registrar IApiClient con implementación AxiosApiClient como singleton
container.register<IApiClient>('IApiClient', {
  useFactory: createApiClient,
});

// Registrar todas las interfaces específicas apuntando a la misma instancia
container.register<IAuthClient>('IAuthClient', {
  useFactory: createApiClient,
});

container.register<IPlayerClient>('IPlayerClient', {
  useFactory: createApiClient,
});

container.register<IEvaluationClient>('IEvaluationClient', {
  useFactory: createApiClient,
});

container.register<IClubClient>('IClubClient', {
  useFactory: createApiClient,
});

container.register<ISubscriptionClient>('ISubscriptionClient', {
  useFactory: createApiClient,
});

container.register<IReportClient>('IReportClient', {
  useFactory: createApiClient,
});

container.register<IEvaluatorClient>('IEvaluatorClient', {
  useFactory: createApiClient,
});

container.register<IAdminClient>('IAdminClient', {
  useFactory: createApiClient,
});

// También registrar AxiosApiClient directamente para casos especiales
container.register<AxiosApiClient>(AxiosApiClient, {
  useFactory: createApiClient,
});

// Función helper para obtener la instancia del API client
export function getApiClient(): IApiClient {
  return container.resolve<IApiClient>('IApiClient');
}

// Función para obtener instancia de AxiosApiClient (para casos que necesiten métodos específicos)
export function getAxiosApiClient(): AxiosApiClient {
  return container.resolve<AxiosApiClient>(AxiosApiClient);
}

// Exportar el container para uso avanzado
export { container };

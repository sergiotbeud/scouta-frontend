import { LoginRequest, LoginResponse, ChangePasswordRequest, ChangePasswordResponse, ChangeEmailRequest, ChangeEmailResponse } from './IApiClient';

/**
 * Interfaz para operaciones de autenticación
 */
export interface IAuthClient {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse>;
  changeEmail(request: ChangeEmailRequest): Promise<ChangeEmailResponse>;
}

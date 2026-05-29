export type Perfil = 'ADMIN' | 'USER';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  mensagem: string;
  token: string | null;
  linkRedefinicao: string | null;
}

export interface ResetPasswordRequest {
  token: string;
  novaSenha: string;
}

export interface UserProfile {
  nome?: string;
  email: string;
  perfil: Perfil;
}

export interface AuthState {
  token: string | null;
  profile: UserProfile | null;
}

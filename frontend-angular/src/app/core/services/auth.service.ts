import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthState,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  Perfil,
  RegisterRequest,
  ResetPasswordRequest,
  UserProfile
} from '../models/auth.models';

interface DecodedToken {
  sub?: string;
  groups?: string[];
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageKey = 'plataforma-cursos-token';

  private readonly state = signal<AuthState>({
    token: null,
    profile: null
  });

  readonly token = computed(() => this.state().token);
  readonly profile = computed(() => this.state().profile);
  readonly isAuthenticated = computed(() => !!this.state().token && !!this.state().profile);

  constructor() {
    const token = localStorage.getItem(this.storageKey);
    if (token) {
      this.applyToken(token);
    }
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap((response) => this.applyToken(response.token))
    );
  }

  register(payload: RegisterRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${environment.apiUrl}/auth/register`, payload);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${environment.apiUrl}/auth/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<{ mensagem: string }> {
    return this.http.post<{ mensagem: string }>(`${environment.apiUrl}/auth/reset-password`, payload);
  }

  registerAdmin(payload: RegisterRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${environment.apiUrl}/auth/register-admin`, payload);
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.state.set({ token: null, profile: null });
    void this.router.navigate(['/login']);
  }

  hasRole(role: Perfil): boolean {
    return this.profile()?.perfil === role;
  }

  routeAfterLogin(): void {
    if (this.hasRole('ADMIN')) {
      void this.router.navigate(['/admin/dashboard']);
      return;
    }

    void this.router.navigate(['/aluno/dashboard']);
  }

  private applyToken(token: string): void {
    const payload = this.decodeToken(token);
    const role = payload.groups?.[0];
    const expired = payload.exp ? payload.exp * 1000 < Date.now() : false;

    if (!payload.sub || !role || expired) {
      this.logout();
      return;
    }

    localStorage.setItem(this.storageKey, token);
    this.state.set({
      token,
      profile: {
        email: payload.sub,
        perfil: role as Perfil
      }
    });
  }

  private decodeToken(token: string): DecodedToken {
    try {
      const payload = token.split('.')[1] ?? '';
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = decodeURIComponent(
        atob(normalizedPayload)
          .split('')
          .map((character) => `%${(`00${character.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join('')
      );

      return JSON.parse(decodedPayload) as DecodedToken;
    } catch {
      return {};
    }
  }
}

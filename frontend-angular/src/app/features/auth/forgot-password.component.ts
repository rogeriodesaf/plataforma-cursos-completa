import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ForgotPasswordResponse } from '../../core/models/auth.models';
import { extractApiError } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <section class="auth-shell">
      <mat-card class="panel auth-card">
        <span class="eyebrow">Recuperacao</span>
        <h1>Esqueci minha senha</h1>
        <p class="muted">Informe seu email para gerar um link seguro de redefinicao.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
            <mat-error *ngIf="form.controls.email.hasError('required')">Informe seu email.</mat-error>
            <mat-error *ngIf="form.controls.email.hasError('email')">Digite um email valido.</mat-error>
          </mat-form-field>

          <button mat-flat-button class="primary full-width" [disabled]="form.invalid || loading()" type="submit">
            {{ loading() ? 'Gerando link...' : 'Gerar link de redefinicao' }}
          </button>
        </form>

        <div class="result panel" *ngIf="response() as currentResponse">
          <strong>{{ currentResponse.mensagem }}</strong>
          <p class="muted">Abra o link abaixo para informar sua nova senha com seguranca.</p>
          <a *ngIf="currentResponse.linkRedefinicao" [href]="buildFrontendResetUrl(currentResponse.token!)" target="_blank" rel="noopener">
            Abrir redefinicao de senha
          </a>
        </div>

        <p class="muted">
          Lembrou a senha?
          <a routerLink="/login">Voltar para entrar</a>
        </p>
      </mat-card>

      <div class="accent panel">
        <span class="eyebrow">Seguranca</span>
        <h2>Tokens temporarios para redefinir a senha com simplicidade e seguranca.</h2>
        <p class="muted">
          O link expira automaticamente e permite atualizar a senha sem depender de integracao externa de email.
        </p>
      </div>
    </section>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 0.95fr 1.05fr;
      gap: 24px;
      padding: 24px;
      align-items: stretch;
    }

    .auth-card,
    .accent,
    .result {
      padding: 32px;
      border-radius: 28px;
    }

    .auth-card {
      display: grid;
      align-content: center;
      gap: 18px;
      background: rgba(255, 252, 247, 0.96);
    }

    .accent {
      background:
        radial-gradient(circle at top left, rgba(255, 216, 143, 0.28), transparent 30%),
        linear-gradient(145deg, rgba(251, 244, 229, 0.96), rgba(241, 226, 195, 0.96));
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16px;
    }

    .accent h2 {
      font-size: clamp(2.4rem, 5vw, 4rem);
      line-height: 0.95;
      max-width: 11ch;
    }

    .form {
      display: grid;
      gap: 12px;
    }

    .result {
      display: grid;
      gap: 10px;
      background: rgba(255, 249, 235, 0.92);
    }

    .result strong {
      font-size: 1rem;
    }

    .primary {
      background: var(--primary);
      color: #fff;
      min-height: 52px;
      border-radius: 14px;
    }

    a {
      color: var(--accent);
      font-weight: 700;
      text-decoration: none;
    }

    @media (max-width: 920px) {
      .auth-shell {
        grid-template-columns: 1fr;
      }

      .auth-card,
      .accent {
        padding: 24px;
      }
    }
  `]
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly loading = signal(false);
  readonly response = signal<ForgotPasswordResponse | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.authService.forgotPassword(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.response.set(response);
        this.notificationService.success('Fluxo de recuperacao iniciado com sucesso.');
      },
      error: (error) => this.notificationService.error(extractApiError(error)),
      complete: () => this.loading.set(false)
    });
  }

  buildFrontendResetUrl(token: string): string {
    return `/redefinir-senha/${encodeURIComponent(token)}`;
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { extractApiError } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  template: `
    <section class="auth-shell">
      <div class="hero">
        <div class="brand-mark">
          <img src="logo-biblica.jpg" alt="Logo da plataforma">
        </div>
        <span class="pill">Plataforma de estudos</span>
        <h1>Suporte de Aprendizado Biblico e Ensino Reformado</h1>
        <p class="muted">
          Entre para acompanhar cursos, aulas, progresso e certificacoes em uma experiencia dedicada a formacao biblica.
        </p>
      </div>

      <mat-card class="panel auth-card">
        <span class="eyebrow">Entrar</span>
        <h2>Login da plataforma</h2>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
            <mat-icon matSuffix>alternate_email</mat-icon>
            <mat-error *ngIf="form.controls.email.hasError('required')">Informe seu email.</mat-error>
            <mat-error *ngIf="form.controls.email.hasError('email')">Digite um email valido.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Senha</mat-label>
            <input matInput formControlName="senha" [type]="hidePassword() ? 'password' : 'text'">
            <button mat-icon-button matSuffix type="button" (click)="togglePassword()">
              <mat-icon>{{ hidePassword() ? 'visibility' : 'visibility_off' }}</mat-icon>
            </button>
            <mat-hint>Use a mesma senha cadastrada, com 6 a 8 caracteres.</mat-hint>
            <mat-error *ngIf="form.controls.senha.hasError('required')">Informe sua senha.</mat-error>
            <mat-error *ngIf="form.controls.senha.hasError('minlength')">A senha precisa ter no minimo 6 caracteres.</mat-error>
          </mat-form-field>

          <button mat-flat-button class="primary full-width" [disabled]="form.invalid || loading()" type="submit">
            {{ loading() ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <a class="secondary-link" routerLink="/esqueci-minha-senha">Esqueci minha senha</a>

        <p class="muted">
          Ainda nao tem acesso?
          <a routerLink="/registro">Criar conta</a>
        </p>
      </mat-card>

      <footer class="auth-footer">
        desenvolvido por Rogerio de Sa - Analista de Sistemas @2026
      </footer>
    </section>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      grid-template-rows: 1fr auto;
      gap: 24px;
      padding: 24px;
      align-items: stretch;
    }

    .hero,
    .auth-card {
      padding: 32px;
      border-radius: 28px;
    }

    .hero {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 18px;
      background:
        radial-gradient(circle at top left, rgba(255, 217, 144, 0.26), transparent 34%),
        linear-gradient(145deg, rgba(47, 28, 17, 0.98), rgba(118, 76, 36, 0.9)),
        linear-gradient(180deg, rgba(255, 241, 208, 0.16), transparent);
      color: #fdfaf1;
      box-shadow: var(--shadow);
    }

    .brand-mark {
      width: 132px;
      height: 132px;
      border-radius: 32px;
      display: grid;
      place-items: center;
      background: rgba(255, 248, 231, 0.14);
      border: 1px solid rgba(255, 248, 231, 0.22);
      box-shadow: 0 18px 40px rgba(28, 14, 4, 0.28);
    }

    .brand-mark img {
      width: 96px;
      height: 96px;
      object-fit: cover;
      border-radius: 24px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.16);
    }

    .hero h1 {
      font-size: clamp(2.8rem, 6vw, 5rem);
      line-height: 0.92;
      margin: 0;
      max-width: 12ch;
    }

    .hero .muted {
      color: rgba(255, 255, 255, 0.78);
      max-width: 42ch;
      font-size: 1.02rem;
    }

    .auth-card {
      display: grid;
      align-content: center;
      gap: 18px;
      background: rgba(255, 252, 247, 0.96);
    }

    .form {
      display: grid;
      gap: 12px;
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

    .secondary-link {
      justify-self: start;
    }

    .auth-footer {
      grid-column: 1 / -1;
      text-align: center;
      color: var(--muted);
      font-size: 0.88rem;
      padding-bottom: 6px;
    }

    @media (max-width: 920px) {
      .auth-shell {
        grid-template-columns: 1fr;
      }

      .hero {
        min-height: 260px;
        align-items: start;
      }

      .auth-card {
        padding: 24px;
      }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly loading = signal(false);
  readonly hidePassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePassword(): void {
    this.hidePassword.update((value) => !value);
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.notificationService.success('Login realizado com sucesso.');
        this.authService.routeAfterLogin();
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error(extractApiError(error));
      },
      complete: () => this.loading.set(false)
    });
  }
}

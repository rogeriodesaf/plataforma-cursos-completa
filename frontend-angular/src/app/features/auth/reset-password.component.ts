import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { extractApiError } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-reset-password',
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
      <mat-card class="panel auth-card">
        <span class="eyebrow">Nova senha</span>
        <h1>Redefinir acesso</h1>
        <p class="muted">Escolha uma nova senha com 6 a 8 caracteres para voltar a entrar na plataforma.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <mat-form-field appearance="outline">
            <mat-label>Nova senha</mat-label>
            <input matInput formControlName="novaSenha" [type]="hidePassword() ? 'password' : 'text'">
            <button mat-icon-button matSuffix type="button" (click)="togglePassword()">
              <mat-icon>{{ hidePassword() ? 'visibility' : 'visibility_off' }}</mat-icon>
            </button>
            <mat-hint>Use de 6 a 8 caracteres.</mat-hint>
            <mat-error *ngIf="form.controls.novaSenha.hasError('required')">Informe a nova senha.</mat-error>
            <mat-error *ngIf="form.controls.novaSenha.hasError('minlength')">A senha precisa ter no minimo 6 caracteres.</mat-error>
            <mat-error *ngIf="form.controls.novaSenha.hasError('maxlength')">A senha pode ter no maximo 8 caracteres.</mat-error>
          </mat-form-field>

          <button mat-flat-button class="primary full-width" [disabled]="form.invalid || loading()" type="submit">
            {{ loading() ? 'Salvando...' : 'Salvar nova senha' }}
          </button>
        </form>

        <p class="muted">
          Ja redefiniu?
          <a routerLink="/login">Voltar para entrar</a>
        </p>
      </mat-card>

      <div class="accent panel">
        <span class="eyebrow">Continuidade</span>
        <h2>Recupere o acesso e retome sua jornada sem perder o progresso.</h2>
        <p class="muted">
          Depois de salvar a nova senha, voce podera voltar ao login e continuar estudando normalmente.
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
    .accent {
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
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly hidePassword = signal(true);
  private token = '';

  readonly form = this.fb.nonNullable.group({
    novaSenha: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(8)]]
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
  }

  togglePassword(): void {
    this.hidePassword.update((value) => !value);
  }

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.notificationService.error('Link de redefinicao invalido.');
      return;
    }

    this.loading.set(true);
    this.authService.resetPassword({
      token: this.token,
      novaSenha: this.form.controls.novaSenha.value
    }).subscribe({
      next: () => {
        this.notificationService.success('Senha redefinida com sucesso. Faca login com a nova senha.');
        void this.router.navigate(['/login']);
      },
      error: (error) => this.notificationService.error(extractApiError(error)),
      complete: () => this.loading.set(false)
    });
  }
}

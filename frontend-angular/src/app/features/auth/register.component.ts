import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { extractApiError } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-register',
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
        <span class="eyebrow">Registro</span>
        <h1>Criar conta de aluno</h1>
        <p class="muted">Seu backend cria novos usuarios com perfil USER por padrao.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <mat-form-field appearance="outline">
            <mat-label>Nome</mat-label>
            <input matInput formControlName="nome">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Senha</mat-label>
            <input matInput formControlName="senha" type="password">
          </mat-form-field>

          <button mat-flat-button class="primary full-width" [disabled]="form.invalid || loading()" type="submit">
            {{ loading() ? 'Criando conta...' : 'Criar conta' }}
          </button>
        </form>

        <p class="muted">
          Ja possui login?
          <a routerLink="/login">Voltar para entrar</a>
        </p>
      </mat-card>

      <div class="accent panel">
        <span class="eyebrow">Fluxo</span>
        <h2>Matricula, progresso e certificado no mesmo ambiente.</h2>
        <p class="muted">
          Depois do registro, o acesso ao dashboard e liberado via login com JWT e guards por perfil.
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
        linear-gradient(145deg, rgba(251, 244, 229, 0.96), rgba(241, 226, 195, 0.96)),
        linear-gradient(135deg, rgba(157, 108, 34, 0.08), transparent);
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
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(8)]]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.notificationService.success('Conta criada. Agora faca o login.');
        void this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error(extractApiError(error));
      },
      complete: () => this.loading.set(false)
    });
  }
}

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
        <p class="muted">Cadastre-se para acompanhar seus cursos, progresso e certificados em um unico ambiente.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <mat-form-field appearance="outline">
            <mat-label>Nome</mat-label>
            <input matInput formControlName="nome">
            <mat-error *ngIf="form.controls.nome.hasError('required')">Informe seu nome.</mat-error>
            <mat-error *ngIf="form.controls.nome.hasError('minlength')">Use pelo menos 3 caracteres.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
            <mat-error *ngIf="form.controls.email.hasError('required')">Informe seu email.</mat-error>
            <mat-error *ngIf="form.controls.email.hasError('email')">Digite um email valido.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Senha</mat-label>
            <input matInput formControlName="senha" type="password">
            <mat-hint>A senha deve ter entre 6 e 8 caracteres.</mat-hint>
            <mat-error *ngIf="form.controls.senha.hasError('required')">Informe uma senha.</mat-error>
            <mat-error *ngIf="form.controls.senha.hasError('minlength')">A senha precisa ter no minimo 6 caracteres.</mat-error>
            <mat-error *ngIf="form.controls.senha.hasError('maxlength')">A senha pode ter no maximo 8 caracteres.</mat-error>
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
        <span class="eyebrow">Jornada</span>
        <h2>Uma experiencia de estudo clara, acolhedora e organizada.</h2>
        <p class="muted">
          Entre na plataforma, acompanhe cada aula no seu ritmo e avance com seguranca ate a conclusao do curso.
        </p>
      </div>

      <footer class="auth-footer">
        desenvolvido por Rogerio de Sa - Analista de Sistemas @2026
      </footer>
    </section>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 0.95fr 1.05fr;
      grid-template-rows: 1fr auto;
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

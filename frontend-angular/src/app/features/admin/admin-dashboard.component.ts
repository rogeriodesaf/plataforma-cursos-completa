import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CourseService } from '../../core/services/course.service';
import { ProfessorService } from '../../core/services/professor.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { extractApiError } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="admin-shell">
      <section class="admin-hero reveal reveal-1">
        <div>
          <span class="eyebrow">Admin</span>
          <h1>Visao operacional da plataforma.</h1>
          <p class="muted">
            Acompanhe a base academica, veja o tamanho da operacao e entre direto nos fluxos de gestao.
          </p>
        </div>

        <div class="hero-side">
          <div class="hero-chip">
            <small>Escopo</small>
            <strong>Gestao academica</strong>
          </div>
          <div class="hero-chip">
            <small>Fluxo</small>
            <strong>Cursos, aulas e professores</strong>
          </div>
        </div>
      </section>

      <section class="stat-grid" *ngIf="!loading(); else loadingState">
        <mat-card class="stat-card reveal reveal-2 tone-1">
          <mat-icon>library_books</mat-icon>
          <strong>{{ courseCount() }}</strong>
          <span class="muted">Cursos ativos</span>
        </mat-card>

        <mat-card class="stat-card reveal reveal-3 tone-2">
          <mat-icon>groups</mat-icon>
          <strong>{{ professorCount() }}</strong>
          <span class="muted">Professores</span>
        </mat-card>

        <mat-card class="stat-card reveal reveal-4 tone-3">
          <mat-icon>badge</mat-icon>
          <strong>{{ userCount() }}</strong>
          <span class="muted">Usuarios</span>
        </mat-card>
      </section>

      <mat-card class="note reveal reveal-4 surface-card">
        <span class="eyebrow">Status da operacao</span>
        <p class="muted">
          A administracao cobre cadastro, edicao e ativacao/desativacao de cursos, aulas e professores pela interface.
        </p>
      </mat-card>

      <ng-template #loadingState>
        <section class="stat-grid">
          <div class="stat-card surface-card skeleton-card" *ngFor="let item of placeholders">
            <div class="skeleton skeleton-circle"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-line"></div>
          </div>
        </section>
      </ng-template>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: grid;
      gap: 24px;
      padding: 24px;
      background:
        radial-gradient(circle at top left, rgba(214, 175, 82, 0.12), transparent 18%),
        linear-gradient(180deg, #fcf7ec, #f4eee1);
    }

    .admin-hero {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 20px;
      padding: 28px;
      border-radius: 30px;
      background:
        radial-gradient(circle at top right, rgba(255, 220, 146, 0.2), transparent 28%),
        linear-gradient(145deg, #22150d, #5b3b1d 58%, #8f6630);
      color: #fffaf0;
      box-shadow: 0 26px 60px rgba(61, 35, 12, 0.22);
    }

    .admin-hero h1 {
      margin: 8px 0;
      font-size: clamp(2.3rem, 4vw, 4rem);
      max-width: 11ch;
      line-height: 0.94;
    }

    .admin-hero .muted {
      color: rgba(255, 248, 236, 0.8);
      max-width: 52ch;
    }

    .hero-side {
      display: grid;
      gap: 14px;
      align-content: center;
    }

    .hero-chip,
    .stat-card,
    .note,
    .skeleton-card {
      padding: 24px;
      border-radius: 24px;
    }

    .hero-chip {
      background: rgba(255, 248, 232, 0.12);
      border: 1px solid rgba(255, 248, 232, 0.18);
    }

    .hero-chip small {
      display: block;
      color: rgba(255, 248, 236, 0.72);
      margin-bottom: 6px;
    }

    .stat-card {
      display: grid;
      gap: 10px;
      border: 1px solid rgba(116, 82, 37, 0.12);
      box-shadow: var(--shadow-soft);
      background: rgba(255, 252, 247, 0.95);
    }

    .stat-card strong {
      font-size: 2rem;
    }

    .stat-card mat-icon {
      color: #8a5d27;
    }

    .tone-1 { background: linear-gradient(180deg, rgba(255, 251, 242, 0.98), rgba(250, 243, 226, 0.98)); }
    .tone-2 { background: linear-gradient(180deg, rgba(249, 255, 248, 0.98), rgba(233, 245, 232, 0.98)); }
    .tone-3 { background: linear-gradient(180deg, rgba(250, 247, 255, 0.98), rgba(241, 233, 247, 0.98)); }

    .note {
      border: 1px solid rgba(116, 82, 37, 0.12);
    }

    .skeleton-card {
      display: grid;
      gap: 12px;
      min-height: 186px;
    }

    .reveal {
      opacity: 0;
      transform: translateY(18px);
      animation: rise-in 520ms ease forwards;
    }

    .reveal-1 { animation-delay: 80ms; }
    .reveal-2 { animation-delay: 150ms; }
    .reveal-3 { animation-delay: 220ms; }
    .reveal-4 { animation-delay: 290ms; }

    @keyframes rise-in {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 980px) {
      .admin-hero {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .admin-shell {
        padding: 16px;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly professorService = inject(ProfessorService);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);

  readonly courseCount = signal(0);
  readonly professorCount = signal(0);
  readonly userCount = signal(0);
  readonly loading = signal(true);
  readonly placeholders = Array.from({ length: 3 });

  ngOnInit(): void {
    forkJoin({
      courses: this.courseService.listCourses(),
      professors: this.professorService.listProfessorsForAdmin(),
      users: this.userService.listUsers()
    }).subscribe({
      next: ({ courses, professors, users }) => {
        this.courseCount.set(courses.length);
        this.professorCount.set(professors.length);
        this.userCount.set(users.length);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error(extractApiError(error));
      }
    });
  }
}

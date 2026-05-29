import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProgressService } from '../../core/services/progress.service';
import { Matricula, Progresso } from '../../core/models/course.models';
import { extractApiError } from '../../core/utils/api-error.util';

interface EnrollmentView {
  enrollment: Matricula;
  progress: Progresso;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="dashboard-shell">
      <section class="dashboard-hero reveal reveal-1">
        <div class="hero-copy">
          <span class="eyebrow">Painel do aluno</span>
          <h1>Seu aprendizado esta em construcao continua.</h1>
          <p>
            Acompanhe o que ja avancou, descubra seu proximo curso e volte exatamente para a aula certa sem perder o ritmo.
          </p>

          <div class="hero-actions">
            <a mat-flat-button routerLink="/aluno/cursos" class="hero-primary">Explorar cursos</a>
            <a mat-stroked-button routerLink="/aluno/cursos" class="hero-secondary">Continuar estudando</a>
          </div>
        </div>

        <div class="hero-rail">
          <div class="focus-card">
            <small>Media geral</small>
            <strong>{{ averageProgress() | number:'1.0-0' }}%</strong>
            <p>ritmo medio entre suas trilhas ativas</p>
          </div>
          <div class="focus-card muted-card">
            <small>Certificaveis</small>
            <strong>{{ completedCount() }}</strong>
            <p>cursos prontos para emissao de certificado</p>
          </div>
        </div>
      </section>

      <section class="stats-grid reveal reveal-2">
        <mat-card class="stat-card tone-1">
          <span class="eyebrow">Matriculas</span>
          <strong>{{ enrollments().length }}</strong>
          <p class="muted">Cursos ativos no seu painel.</p>
        </mat-card>

        <mat-card class="stat-card tone-2">
          <span class="eyebrow">Concluidos</span>
          <strong>{{ completedCount() }}</strong>
          <p class="muted">Trilhas com progresso completo.</p>
        </mat-card>

        <mat-card class="stat-card tone-3">
          <span class="eyebrow">Proxima meta</span>
          <strong>{{ nextMilestoneLabel() }}</strong>
          <p class="muted">Etapa mais proxima da conclusao.</p>
        </mat-card>
      </section>

      <section class="section-header reveal reveal-3">
        <div>
          <span class="eyebrow">Trilhas</span>
          <h2>Seu painel de progresso</h2>
        </div>
        <span class="pill accent-pill">{{ courseProgress().length }} cursos em acompanhamento</span>
      </section>

      <div class="progress-grid" *ngIf="loading()">
        <mat-card class="progress-card skeleton-card" *ngFor="let item of placeholders">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line"></div>
        </mat-card>
      </div>

      <div class="progress-grid" *ngIf="!loading() && courseProgress().length">
        <mat-card class="progress-card reveal" *ngFor="let item of courseProgress(); let index = index" [style.animationDelay.ms]="180 + (index * 70)">
          <div class="card-top">
            <div>
              <h3>{{ item.enrollment.tituloCurso }}</h3>
              <p class="muted">Matricula em {{ item.enrollment.dataMatricula | date:'dd/MM/yyyy' }}</p>
            </div>
            <span class="pill progress-pill">{{ item.progress.aulasConcluidas }}/{{ item.progress.totalAuLas }} aulas</span>
          </div>

          <div class="progress-line">
            <div>
              <small>Percentual</small>
              <strong>{{ item.progress.percentual | number:'1.0-0' }}%</strong>
            </div>
            <div>
              <small>Status</small>
              <strong>{{ item.progress.percentual >= 100 ? 'Certificavel' : 'Em andamento' }}</strong>
            </div>
          </div>

          <mat-progress-bar mode="determinate" [value]="item.progress.percentual"></mat-progress-bar>

          <div class="card-actions">
            <a mat-stroked-button class="course-action" [routerLink]="['/aluno/cursos', item.enrollment.cursoId, 'aulas']">
              Abrir aulas
            </a>
          </div>
        </mat-card>
      </div>

      <ng-container *ngIf="!loading() && !courseProgress().length">
        <ng-container *ngTemplateOutlet="emptyState"></ng-container>
      </ng-container>

      <ng-template #emptyState>
        <mat-card class="empty-card reveal reveal-3">
          <mat-icon>school</mat-icon>
          <h3>Nenhuma matricula ainda</h3>
          <p class="muted">Escolha um curso para iniciar sua jornada.</p>
          <a mat-flat-button routerLink="/aluno/cursos" class="hero-primary">Ver cursos</a>
        </mat-card>
      </ng-template>
    </div>
  `,
  styles: [`
    .dashboard-shell {
      display: grid;
      gap: 24px;
      padding: 24px;
      background:
        radial-gradient(circle at top left, rgba(214, 175, 82, 0.12), transparent 18%),
        linear-gradient(180deg, #fcf7ec, #f4eee1);
    }

    .dashboard-hero {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 22px;
      padding: 30px;
      border-radius: 30px;
      background:
        radial-gradient(circle at top right, rgba(255, 220, 146, 0.2), transparent 28%),
        linear-gradient(145deg, #22150d, #5b3b1d 58%, #8f6630);
      color: #fffaf0;
      box-shadow: 0 26px 60px rgba(61, 35, 12, 0.22);
    }

    .hero-copy {
      display: grid;
      gap: 16px;
      align-content: center;
    }

    .hero-copy h1 {
      margin: 0;
      font-size: clamp(2.4rem, 5vw, 4.6rem);
      line-height: 0.94;
      max-width: 11ch;
    }

    .hero-copy p {
      margin: 0;
      max-width: 58ch;
      color: rgba(255, 248, 236, 0.8);
      font-size: 1.02rem;
    }

    .hero-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .hero-primary,
    .hero-secondary {
      min-height: 48px;
      border-radius: 14px;
    }

    .hero-primary {
      background: #f6ead1;
      color: #6f4719;
    }

    .hero-secondary {
      border-color: rgba(255, 248, 236, 0.3);
      color: #fffaf0;
    }

    .hero-rail {
      display: grid;
      gap: 14px;
      align-content: center;
    }

    .focus-card {
      padding: 20px;
      border-radius: 22px;
      background: rgba(255, 248, 232, 0.12);
      border: 1px solid rgba(255, 248, 232, 0.18);
      backdrop-filter: blur(10px);
    }

    .focus-card small {
      display: block;
      color: rgba(255, 248, 236, 0.72);
      margin-bottom: 6px;
    }

    .focus-card strong {
      font-size: 2rem;
    }

    .focus-card p {
      margin: 8px 0 0;
      color: rgba(255, 248, 236, 0.72);
    }

    .muted-card {
      background: rgba(255, 255, 255, 0.08);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .stat-card,
    .progress-card,
    .empty-card {
      padding: 22px;
      border-radius: 26px;
      background: rgba(255, 252, 247, 0.95);
      border: 1px solid rgba(116, 82, 37, 0.12);
      box-shadow: 0 20px 38px rgba(83, 56, 23, 0.08);
    }

    .stat-card strong {
      display: block;
      margin: 6px 0 8px;
      font-size: 2rem;
    }

    .tone-1 { background: linear-gradient(180deg, rgba(255, 251, 242, 0.98), rgba(250, 243, 226, 0.98)); }
    .tone-2 { background: linear-gradient(180deg, rgba(249, 255, 248, 0.98), rgba(233, 245, 232, 0.98)); }
    .tone-3 { background: linear-gradient(180deg, rgba(250, 247, 255, 0.98), rgba(241, 233, 247, 0.98)); }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 16px;
      flex-wrap: wrap;
    }

    .section-header h2,
    .progress-card h3,
    .empty-card h3 {
      margin: 0;
    }

    .accent-pill {
      background: rgba(255, 243, 214, 0.92);
      color: #7c521b;
    }

    .progress-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .progress-card {
      display: grid;
      gap: 16px;
    }

    .skeleton-card {
      min-height: 220px;
    }

    .card-top,
    .progress-line,
    .card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .progress-pill {
      background: rgba(255, 243, 214, 0.92);
      color: #7c521b;
    }

    .progress-line small {
      display: block;
      color: var(--muted);
      margin-bottom: 4px;
    }

    .course-action {
      min-height: 48px;
      width: 100%;
      border-radius: 14px;
    }

    .empty-card {
      display: grid;
      gap: 12px;
      place-items: center;
      text-align: center;
      padding: 48px 24px;
    }

    .empty-card mat-icon {
      width: 42px;
      height: 42px;
      font-size: 42px;
      color: #9d6c22;
    }

    .reveal {
      opacity: 0;
      transform: translateY(18px);
      animation: rise-in 520ms ease forwards;
    }

    .reveal-1 { animation-delay: 80ms; }
    .reveal-2 { animation-delay: 150ms; }
    .reveal-3 { animation-delay: 220ms; }

    @keyframes rise-in {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 1024px) {
      .dashboard-hero,
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 760px) {
      .dashboard-shell {
        padding: 16px;
      }

      .dashboard-hero {
        padding: 22px;
      }
    }
  `]
})
export class StudentDashboardComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly progressService = inject(ProgressService);
  private readonly notificationService = inject(NotificationService);

  readonly enrollments = signal<Matricula[]>([]);
  readonly courseProgress = signal<EnrollmentView[]>([]);
  readonly loading = signal(true);
  readonly placeholders = Array.from({ length: 3 });
  readonly nextMilestoneLabel = computed(() => {
    const nextCourse = this.courseProgress()
      .filter((item) => item.progress.percentual < 100)
      .sort((left, right) => right.progress.percentual - left.progress.percentual)[0];

    return nextCourse ? `${Math.round(nextCourse.progress.percentual)}%` : '100%';
  });

  ngOnInit(): void {
    this.load();
  }

  completedCount(): number {
    return this.courseProgress().filter((item) => item.progress.percentual >= 100).length;
  }

  averageProgress(): number {
    const items = this.courseProgress();
    if (!items.length) {
      return 0;
    }

    return items.reduce((total, item) => total + item.progress.percentual, 0) / items.length;
  }

  private load(): void {
    this.enrollmentService.listMine().subscribe({
      next: (enrollments) => {
        this.enrollments.set(enrollments);
        if (!enrollments.length) {
          this.courseProgress.set([]);
          this.loading.set(false);
          return;
        }

        forkJoin(
          enrollments.map((enrollment) => this.progressService.getCourseProgress(enrollment.cursoId))
        ).subscribe({
          next: (progressList) => {
            this.courseProgress.set(
              enrollments.map((enrollment, index) => ({
                enrollment,
                progress: progressList[index]
              }))
            );
            this.loading.set(false);
          },
          error: (error) => {
            this.loading.set(false);
            this.notificationService.error(extractApiError(error));
          }
        });
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error(extractApiError(error));
      }
    });
  }
}

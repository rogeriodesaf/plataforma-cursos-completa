import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CourseService } from '../../core/services/course.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { NotificationService } from '../../core/services/notification.service';
import { Curso, Matricula } from '../../core/models/course.models';
import { extractApiError } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-course-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="catalog-shell">
      <section class="catalog-hero reveal reveal-1">
        <div class="hero-copy">
          <span class="eyebrow">Catalogo da plataforma</span>
          <h1>Escolha a proxima trilha da sua formacao.</h1>
          <p>
            Explore cursos, acompanhe seu progresso e entre nas aulas com uma experiencia mais proxima de uma plataforma de ensino moderna.
          </p>
        </div>

        <div class="hero-summary">
          <div class="summary-card">
            <small>Cursos ativos</small>
            <strong>{{ courses().length }}</strong>
          </div>
          <div class="summary-card">
            <small>Matriculas ativas</small>
            <strong>{{ enrolledCount() }}</strong>
          </div>
        </div>
      </section>

      <section class="catalog-toolbar reveal reveal-2">
        <div>
          <span class="eyebrow">Descoberta</span>
          <h2>Cursos disponiveis</h2>
        </div>
        <span class="pill accent-pill">{{ courses().length }} opcoes abertas</span>
      </section>

      <div class="catalog-grid" *ngIf="loading()">
        <div class="course-card skeleton-card" *ngFor="let item of placeholders">
          <div class="course-banner skeleton"></div>
          <div class="course-content">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line"></div>
          </div>
          <div class="course-actions">
            <div class="skeleton skeleton-line button-skeleton"></div>
          </div>
        </div>
      </div>

      <div class="catalog-grid" *ngIf="!loading() && courses().length">
        <mat-card class="course-card reveal" *ngFor="let course of courses(); let index = index" [style.animationDelay.ms]="120 + (index * 70)">
          <div class="course-banner">
            <div class="course-overlay">
              <span class="pill status-pill" *ngIf="isEnrolled(course.id)">Matriculado</span>
              <span class="pill status-pill" *ngIf="!isEnrolled(course.id)">Novo percurso</span>
              <span class="course-index">{{ index + 1 | number:'2.0' }}</span>
            </div>
          </div>

          <div class="course-content">
            <h3>{{ course.titulo }}</h3>
            <p class="muted">{{ course.descricao }}</p>

            <div class="course-meta">
              <span><mat-icon>school</mat-icon> Trilha guiada</span>
              <span><mat-icon>workspace_premium</mat-icon> Certificado</span>
            </div>
          </div>

          <div class="course-actions">
            <button
              mat-flat-button
              class="primary"
              *ngIf="!isEnrolled(course.id)"
              (click)="enroll(course.id)">
              Matricular
            </button>

            <a
              mat-stroked-button
              class="secondary"
              *ngIf="isEnrolled(course.id)"
              [routerLink]="['/aluno/cursos', course.id, 'aulas']">
              Abrir aulas
            </a>
          </div>
        </mat-card>
      </div>

      <ng-container *ngIf="!loading() && !courses().length">
        <ng-container *ngTemplateOutlet="emptyState"></ng-container>
      </ng-container>

      <ng-template #emptyState>
        <mat-card class="empty-card reveal reveal-3">
          <mat-icon>menu_book</mat-icon>
          <h3>Nenhum curso publicado ainda</h3>
          <p class="muted">Assim que voce cadastrar cursos no admin, eles aparecerao aqui para matricula.</p>
        </mat-card>
      </ng-template>
    </div>
  `,
  styles: [`
    .catalog-shell {
      display: grid;
      gap: 24px;
      padding: 24px;
      background:
        radial-gradient(circle at top left, rgba(214, 175, 82, 0.12), transparent 18%),
        linear-gradient(180deg, #fcf7ec, #f4eee1);
    }

    .catalog-hero {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 20px;
      padding: 30px;
      border-radius: 30px;
      color: #fffaf0;
      background:
        radial-gradient(circle at top right, rgba(255, 220, 152, 0.24), transparent 28%),
        linear-gradient(145deg, #22150d, #5e3b1b 58%, #93652c);
      box-shadow: 0 26px 60px rgba(61, 35, 12, 0.22);
    }

    .hero-copy {
      display: grid;
      gap: 14px;
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
      color: rgba(255, 248, 236, 0.8);
      max-width: 54ch;
      font-size: 1.02rem;
    }

    .hero-summary {
      display: grid;
      gap: 14px;
      align-content: center;
    }

    .summary-card {
      padding: 18px 20px;
      border-radius: 22px;
      background: rgba(255, 248, 232, 0.12);
      border: 1px solid rgba(255, 248, 232, 0.18);
      backdrop-filter: blur(10px);
    }

    .summary-card small {
      display: block;
      color: rgba(255, 248, 236, 0.72);
      margin-bottom: 6px;
    }

    .summary-card strong {
      font-size: 2rem;
    }

    .catalog-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 16px;
      flex-wrap: wrap;
    }

    .catalog-toolbar h2,
    .course-content h3,
    .empty-card h3 {
      margin: 0;
    }

    .accent-pill {
      background: rgba(255, 243, 214, 0.92);
      color: #7c521b;
    }

    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .course-card,
    .empty-card {
      padding: 0;
      border-radius: 28px;
      overflow: hidden;
      border: 1px solid rgba(116, 82, 37, 0.12);
      box-shadow: 0 20px 38px rgba(83, 56, 23, 0.08);
      background: rgba(255, 252, 247, 0.95);
    }

    .skeleton-card {
      padding: 0;
      border-radius: 28px;
      overflow: hidden;
      border: 1px solid rgba(116, 82, 37, 0.12);
      box-shadow: 0 20px 38px rgba(83, 56, 23, 0.08);
      background: rgba(255, 252, 247, 0.95);
    }

    .course-banner {
      min-height: 164px;
      background:
        radial-gradient(circle at top right, rgba(255, 214, 136, 0.3), transparent 25%),
        linear-gradient(145deg, #3a2316, #7d5125 62%, #b27f44);
    }

    .course-overlay {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 12px;
      padding: 18px;
    }

    .status-pill {
      background: rgba(255, 248, 232, 0.92);
      color: #6f4719;
    }

    .course-index {
      color: rgba(255, 248, 236, 0.8);
      font-size: 1.8rem;
      font-weight: 800;
    }

    .course-content {
      display: grid;
      gap: 14px;
      padding: 22px 22px 12px;
    }

    .course-meta {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      color: var(--muted);
      font-size: 0.92rem;
    }

    .course-meta span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .course-meta mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
      color: #8a5d27;
    }

    .course-actions {
      padding: 0 22px 22px;
    }

    .button-skeleton {
      height: 48px;
      border-radius: 14px;
    }

    .primary,
    .secondary {
      min-height: 48px;
      width: 100%;
      border-radius: 14px;
    }

    .primary {
      background: var(--primary);
      color: #fff;
    }

    .empty-card {
      display: grid;
      gap: 12px;
      place-items: center;
      padding: 48px 24px;
      text-align: center;
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

    @media (max-width: 980px) {
      .catalog-hero {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 760px) {
      .catalog-shell {
        padding: 16px;
      }

      .catalog-hero {
        padding: 22px;
      }
    }
  `]
})
export class CourseCatalogComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly notificationService = inject(NotificationService);

  readonly courses = signal<Curso[]>([]);
  readonly enrollments = signal<Matricula[]>([]);
  readonly enrolledCount = computed(() => this.enrollments().filter((item) => item.ativa).length);
  readonly loading = signal(true);
  readonly placeholders = Array.from({ length: 3 });

  ngOnInit(): void {
    this.load();
  }

  isEnrolled(courseId: number): boolean {
    return this.enrollments().some((item) => item.cursoId === courseId && item.ativa);
  }

  enroll(courseId: number): void {
    this.enrollmentService.enroll(courseId).subscribe({
      next: (enrollment) => {
        this.enrollments.update((items) => [...items, enrollment]);
        this.notificationService.success('Matricula realizada com sucesso.');
      },
      error: (error) => this.notificationService.error(extractApiError(error))
    });
  }

  private load(): void {
    this.courseService.listCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error(extractApiError(error));
      }
    });

    this.enrollmentService.listMine().subscribe({
      next: (enrollments) => this.enrollments.set(enrollments),
      error: () => this.enrollments.set([])
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CourseService } from '../../core/services/course.service';
import { NotificationService } from '../../core/services/notification.service';
import { Curso } from '../../core/models/course.models';
import { extractApiError } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <div class="admin-shell">
      <section class="form-panel surface-card reveal reveal-1">
        <span class="eyebrow">Cursos</span>
        <h1>{{ editingId() ? 'Editar curso' : 'Novo curso' }}</h1>
        <p class="muted">Organize o catalogo com titulos claros e descricoes que vendam bem a experiencia do curso.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <mat-form-field appearance="outline">
            <mat-label>Titulo</mat-label>
            <input matInput formControlName="titulo">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Descricao</mat-label>
            <textarea matInput formControlName="descricao" rows="6"></textarea>
          </mat-form-field>

          <div class="actions">
            <button mat-flat-button class="primary" type="submit" [disabled]="form.invalid">
              {{ editingId() ? 'Salvar alteracoes' : 'Cadastrar curso' }}
            </button>

            <button mat-stroked-button type="button" *ngIf="editingId()" (click)="resetForm()">Cancelar</button>
          </div>
        </form>
      </section>

      <section class="list-panel surface-card reveal reveal-2">
        <div class="section-title compact-title">
          <div>
            <span class="eyebrow">Gestao</span>
            <h2>Cursos cadastrados</h2>
          </div>
          <span class="pill">{{ filteredCourses().length }} visiveis</span>
        </div>

        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar curso</mat-label>
          <input matInput [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)">
        </mat-form-field>

        <div class="course-list" *ngIf="!loading(); else loadingState">
          <mat-card class="course-card surface-card" *ngFor="let course of filteredCourses()">
            <div class="heading">
              <div>
                <h3>{{ course.titulo }}</h3>
                <p class="muted">{{ course.descricao }}</p>
              </div>
              <span class="pill">{{ course.ativo ? 'Ativo' : 'Desativado' }}</span>
            </div>

            <div class="actions">
              <button mat-stroked-button type="button" (click)="editCourse(course)">Editar</button>
              <button mat-flat-button type="button" [class.warn]="course.ativo" [class.primary]="!course.ativo" (click)="toggleActive(course)">
                {{ course.ativo ? 'Desativar' : 'Ativar' }}
              </button>
            </div>
          </mat-card>

          <p class="muted" *ngIf="!filteredCourses().length">Nenhum curso corresponde ao filtro atual.</p>
        </div>
      </section>

      <ng-template #loadingState>
        <div class="course-list">
          <div class="surface-card skeleton-card" *ngFor="let item of placeholders">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line"></div>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: grid;
      grid-template-columns: 390px 1fr;
      gap: 20px;
      padding: 24px;
    }

    .form-panel,
    .list-panel,
    .course-card,
    .skeleton-card {
      padding: 24px;
      border-radius: 28px;
    }

    .form,
    .course-list {
      display: grid;
      gap: 16px;
    }

    .search-field {
      width: min(320px, 100%);
    }

    .compact-title {
      margin-bottom: 8px;
    }

    .actions,
    .heading {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 16px;
      flex-wrap: wrap;
    }

    .primary {
      background: var(--primary);
      color: #fff;
    }

    .warn {
      background: var(--danger);
      color: #fff;
    }

    .skeleton-card {
      min-height: 150px;
      display: grid;
      gap: 12px;
    }

    .reveal {
      opacity: 0;
      transform: translateY(18px);
      animation: rise-in 520ms ease forwards;
    }

    .reveal-1 { animation-delay: 80ms; }
    .reveal-2 { animation-delay: 160ms; }

    @keyframes rise-in {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 1240px) {
      .admin-shell {
        grid-template-columns: 340px 1fr;
      }
    }

    @media (max-width: 1080px) {
      .admin-shell {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .admin-shell {
        padding: 16px;
      }

      .actions button {
        width: 100%;
      }
    }
  `]
})
export class AdminCoursesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly courseService = inject(CourseService);
  private readonly notificationService = inject(NotificationService);

  readonly courses = signal<Curso[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly searchTerm = signal('');
  readonly loading = signal(true);
  readonly placeholders = Array.from({ length: 3 });
  readonly filteredCourses = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.courses();
    }

    return this.courses().filter((course) =>
      `${course.titulo} ${course.descricao}`.toLowerCase().includes(term)
    );
  });

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required]],
    descricao: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.load();
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const request$ = this.editingId()
      ? this.courseService.updateCourse(this.editingId()!, this.form.getRawValue())
      : this.courseService.createCourse(this.form.getRawValue());

    request$.subscribe({
      next: (course) => {
        if (this.editingId()) {
          this.courses.update((items) => items.map((item) => item.id === course.id ? course : item));
          this.notificationService.success('Curso atualizado com sucesso.');
        } else {
          this.courses.update((items) => [course, ...items]);
          this.notificationService.success('Curso cadastrado com sucesso.');
        }
        this.resetForm();
      },
      error: (error) => this.notificationService.error(extractApiError(error))
    });
  }

  editCourse(course: Curso): void {
    this.editingId.set(course.id);
    this.form.patchValue({
      titulo: course.titulo,
      descricao: course.descricao
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      titulo: '',
      descricao: ''
    });
  }

  toggleActive(course: Curso): void {
    const request$ = course.ativo
      ? this.courseService.deactivateCourse(course.id)
      : this.courseService.activateCourse(course.id);

    request$.subscribe({
      next: () => {
        this.courses.update((items) => items.map((item) => (
          item.id === course.id ? { ...item, ativo: !item.ativo } : item
        )));
        this.notificationService.success(course.ativo ? 'Curso desativado.' : 'Curso ativado.');
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
  }
}

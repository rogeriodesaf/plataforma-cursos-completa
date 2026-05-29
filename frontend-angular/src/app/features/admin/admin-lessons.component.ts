import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CourseService } from '../../core/services/course.service';
import { LessonService } from '../../core/services/lesson.service';
import { ProfessorService } from '../../core/services/professor.service';
import { NotificationService } from '../../core/services/notification.service';
import { Aula, Curso, Professor } from '../../core/models/course.models';
import { extractApiError } from '../../core/utils/api-error.util';
import { normalizeVideoUrl } from '../../core/utils/video-url.util';

@Component({
  selector: 'app-admin-lessons',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="admin-shell">
      <section class="form-panel surface-card reveal reveal-1">
        <span class="eyebrow">Aulas</span>
        <h1>{{ editingLessonId() ? 'Editar aula' : 'Cadastro de aulas' }}</h1>
        <p class="muted">A ordem e definida automaticamente pelo backend. Cole um link do YouTube e a plataforma converte para o formato ideal.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <mat-form-field appearance="outline">
            <mat-label>Curso</mat-label>
            <mat-select formControlName="cursoId">
              <mat-option *ngFor="let course of courses()" [value]="course.id">{{ course.titulo }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Professor</mat-label>
            <mat-select formControlName="professorId">
              <mat-option *ngFor="let professor of professors()" [value]="professor.id">{{ professor.nome }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Titulo</mat-label>
            <input matInput formControlName="titulo">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Descricao</mat-label>
            <textarea matInput formControlName="descricao" rows="4"></textarea>
          </mat-form-field>

          <div class="field-stack">
            <mat-form-field appearance="outline">
              <mat-label>URL do video</mat-label>
              <input matInput formControlName="urlVideo" (blur)="normalizeVideoField()">
            </mat-form-field>
            <p class="field-helper">Aceita link normal do YouTube, link curto ou link embed.</p>
          </div>

          <div class="video-preview" *ngIf="videoPreviewUrl() as previewUrl">
            <span class="eyebrow">Previa</span>
            <iframe
              [src]="previewUrl"
              title="Previa do video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Duracao</mat-label>
            <input matInput formControlName="duracaoMinutos" type="number">
          </mat-form-field>

          <div class="form-actions">
            <button mat-flat-button class="primary" type="submit" [disabled]="form.invalid">
              {{ editingLessonId() ? 'Salvar alteracoes' : 'Cadastrar aula' }}
            </button>

            <button mat-stroked-button type="button" *ngIf="editingLessonId()" (click)="cancelEdit()">Cancelar</button>
          </div>
        </form>
      </section>

      <section class="list-panel surface-card reveal reveal-2">
        <div class="section-title compact-title">
          <div>
            <span class="eyebrow">Consulta</span>
            <h2>Aulas por curso</h2>
          </div>
        </div>

        <div class="toolbar">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Selecionar curso</mat-label>
            <mat-select [value]="selectedCourseId()" (valueChange)="filterByCourse($event)">
              <mat-option *ngFor="let course of courses()" [value]="course.id">{{ course.titulo }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Buscar aula</mat-label>
            <input matInput [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)">
          </mat-form-field>
        </div>

        <div class="lesson-list" *ngIf="!loading(); else loadingState">
          <mat-card class="lesson-card surface-card" *ngFor="let lesson of filteredLessons()">
            <div class="heading">
              <div>
                <h3>{{ lesson.ordem }}. {{ lesson.titulo }}</h3>
                <p class="muted">{{ lesson.nomeProfessor }} - {{ lesson.nomeCurso }}</p>
              </div>
              <span class="pill">{{ lesson.ativa ? 'Ativa' : 'Inativa' }}</span>
            </div>

            <p class="muted">{{ lesson.descricao }}</p>

            <div class="actions">
              <span class="pill">{{ lesson.duracaoMinutos }} min</span>

              <div class="button-group">
                <button mat-stroked-button type="button" (click)="editLesson(lesson)">Editar</button>

                <button
                  mat-flat-button
                  type="button"
                  [class.warn]="lesson.ativa"
                  [class.primary]="!lesson.ativa"
                  (click)="toggleLesson(lesson)">
                  {{ lesson.ativa ? 'Desativar' : 'Ativar' }}
                </button>
              </div>
            </div>
          </mat-card>

          <p class="muted" *ngIf="!filteredLessons().length">Nenhuma aula corresponde ao curso ou filtro selecionado.</p>
        </div>
      </section>

      <ng-template #loadingState>
        <div class="lesson-list">
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
      grid-template-columns: 400px 1fr;
      gap: 20px;
      padding: 24px;
    }

    .form-panel,
    .list-panel,
    .lesson-card,
    .skeleton-card {
      padding: 24px;
      border-radius: 28px;
    }

    .form,
    .lesson-list {
      display: grid;
      gap: 16px;
    }

    .toolbar {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 8px;
    }

    .field-stack {
      display: grid;
      gap: 8px;
    }

    .field-helper {
      margin: -4px 4px 0;
      font-size: 0.87rem;
      color: var(--muted);
      line-height: 1.45;
    }

    .filter-field {
      width: 100%;
    }

    .compact-title {
      margin-bottom: 8px;
    }

    .video-preview {
      display: grid;
      gap: 10px;
    }

    .video-preview iframe {
      width: 100%;
      aspect-ratio: 16 / 9;
      border: 0;
      border-radius: 18px;
      background: #000;
      overflow: hidden;
      box-shadow: var(--shadow);
    }

    .heading,
    .actions,
    .form-actions,
    .button-group {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
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
      min-height: 170px;
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

    @media (max-width: 1280px) {
      .admin-shell {
        grid-template-columns: 360px 1fr;
      }
    }

    @media (max-width: 1080px) {
      .admin-shell {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 820px) {
      .toolbar {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .admin-shell {
        padding: 16px;
      }

      .button-group button,
      .form-actions button {
        width: 100%;
      }
    }
  `]
})
export class AdminLessonsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly courseService = inject(CourseService);
  private readonly professorService = inject(ProfessorService);
  private readonly lessonService = inject(LessonService);
  private readonly notificationService = inject(NotificationService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly courses = signal<Curso[]>([]);
  readonly professors = signal<Professor[]>([]);
  readonly lessons = signal<Aula[]>([]);
  readonly selectedCourseId = signal<number | null>(null);
  readonly editingLessonId = signal<number | null>(null);
  readonly searchTerm = signal('');
  readonly loading = signal(true);
  readonly placeholders = Array.from({ length: 3 });

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required]],
    descricao: ['', [Validators.required]],
    urlVideo: ['', [Validators.required]],
    duracaoMinutos: [10, [Validators.required, Validators.min(1)]],
    cursoId: [0, [Validators.required, Validators.min(1)]],
    professorId: [0, [Validators.required, Validators.min(1)]]
  });

  readonly videoPreviewUrl = computed(() => {
    const url = normalizeVideoUrl(this.form.controls.urlVideo.value);
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  readonly filteredLessons = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.lessons();
    }

    return this.lessons().filter((lesson) =>
      `${lesson.titulo} ${lesson.descricao} ${lesson.nomeProfessor}`.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.courseService.listCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        if (courses[0]) {
          this.selectedCourseId.set(courses[0].id);
          this.form.patchValue({ cursoId: courses[0].id });
          this.filterByCourse(courses[0].id);
        } else {
          this.loading.set(false);
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error(extractApiError(error));
      }
    });

    this.professorService.listProfessorsForAdmin().subscribe({
      next: (professors) => {
        this.professors.set(professors);
        if (professors[0]) {
          this.form.patchValue({ professorId: professors[0].id });
        }
      },
      error: (error) => this.notificationService.error(extractApiError(error))
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.normalizeVideoField();

    const lessonId = this.editingLessonId();
    const request = lessonId
      ? this.lessonService.updateLesson(lessonId, this.form.getRawValue())
      : this.lessonService.createLesson(this.form.getRawValue());

    request.subscribe({
      next: (lesson) => {
        if (lessonId) {
          this.lessons.update((items) =>
            items
              .map((item) => item.id === lesson.id ? lesson : item)
              .sort((left, right) => left.ordem - right.ordem)
          );
          this.notificationService.success('Aula atualizada com sucesso.');
        } else {
          if (lesson.cursoId === this.selectedCourseId()) {
            this.lessons.update((items) => [...items, lesson].sort((left, right) => left.ordem - right.ordem));
          }
          this.notificationService.success('Aula cadastrada com sucesso.');
        }

        this.cancelEdit();
      },
      error: (error) => this.notificationService.error(extractApiError(error))
    });
  }

  editLesson(lesson: Aula): void {
    this.editingLessonId.set(lesson.id);
    this.form.setValue({
      titulo: lesson.titulo,
      descricao: lesson.descricao,
      urlVideo: lesson.urlVideo,
      duracaoMinutos: lesson.duracaoMinutos,
      cursoId: lesson.cursoId,
      professorId: lesson.professorId
    });
  }

  cancelEdit(): void {
    this.editingLessonId.set(null);
    this.form.reset({
      titulo: '',
      descricao: '',
      urlVideo: '',
      duracaoMinutos: 10,
      cursoId: this.selectedCourseId() ?? this.courses()[0]?.id ?? 0,
      professorId: this.professors()[0]?.id ?? 0
    });
  }

  toggleLesson(lesson: Aula): void {
    if (lesson.ativa) {
      this.lessonService.deactivateLesson(lesson.id).subscribe({
        next: () => {
          this.lessons.update((items) =>
            items.map((item) => item.id === lesson.id ? { ...item, ativa: false } : item)
          );
          this.notificationService.success('Aula desativada com sucesso.');
        },
        error: (error: unknown) => this.notificationService.error(extractApiError(error))
      });
      return;
    }

    this.lessonService.activateLesson(lesson.id).subscribe({
      next: (updated) => {
        this.lessons.update((items) => items.map((item) => item.id === updated.id ? updated : item));
        this.notificationService.success('Aula ativada com sucesso.');
      },
      error: (error: unknown) => this.notificationService.error(extractApiError(error))
    });
  }

  filterByCourse(courseId: number): void {
    this.selectedCourseId.set(courseId);
    this.loading.set(true);
    if (!this.editingLessonId()) {
      this.form.patchValue({ cursoId: courseId });
    }

    this.lessonService.listByCourseForAdmin(courseId).subscribe({
      next: (lessons) => {
        this.lessons.set([...lessons].sort((left, right) => left.ordem - right.ordem));
        this.loading.set(false);
      },
      error: (error) => {
        this.lessons.set([]);
        this.loading.set(false);
        this.notificationService.error(extractApiError(error));
      }
    });
  }

  normalizeVideoField(): void {
    const currentValue = this.form.controls.urlVideo.value;
    this.form.patchValue({ urlVideo: normalizeVideoUrl(currentValue) });
  }
}

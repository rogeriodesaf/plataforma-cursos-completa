import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProfessorService } from '../../core/services/professor.service';
import { NotificationService } from '../../core/services/notification.service';
import { Professor } from '../../core/models/course.models';
import { extractApiError } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-admin-professors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="admin-shell">
      <section class="form-panel surface-card reveal reveal-1">
        <span class="eyebrow">Professores</span>
        <h1>{{ editingProfessorId() ? 'Editar professor' : 'Cadastro de professores' }}</h1>
        <p class="muted">Mantenha a equipe visivel com especialidades claras para orientar melhor a grade de aulas.</p>

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
            <mat-label>Especialidade</mat-label>
            <input matInput formControlName="especialidade">
          </mat-form-field>

          <div class="form-actions">
            <button mat-flat-button class="primary" type="submit" [disabled]="form.invalid">
              {{ editingProfessorId() ? 'Salvar alteracoes' : 'Cadastrar professor' }}
            </button>

            <button mat-stroked-button type="button" *ngIf="editingProfessorId()" (click)="cancelEdit()">Cancelar</button>
          </div>
        </form>
      </section>

      <section class="list-panel surface-card reveal reveal-2">
        <div class="section-title compact-title">
          <div>
            <span class="eyebrow">Equipe</span>
            <h2>Professores cadastrados</h2>
          </div>
          <span class="pill">{{ activeProfessorCount() }} ativos</span>
        </div>

        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar professor</mat-label>
          <input matInput [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)">
        </mat-form-field>

        <div class="card-grid" *ngIf="!loading(); else loadingState">
          <mat-card class="professor-card surface-card" *ngFor="let professor of filteredProfessors()">
            <div class="card-header">
              <div>
                <h3>{{ professor.nome }}</h3>
                <p class="muted">{{ professor.email }}</p>
              </div>
              <span class="pill">{{ professor.ativo ? 'Ativo' : 'Inativo' }}</span>
            </div>

            <span class="pill">{{ professor.especialidade || 'Sem especialidade informada' }}</span>

            <div class="actions">
              <button mat-stroked-button type="button" (click)="editProfessor(professor)">Editar</button>

              <button
                mat-flat-button
                type="button"
                [class.warn]="professor.ativo"
                [class.primary]="!professor.ativo"
                (click)="toggleProfessor(professor)">
                {{ professor.ativo ? 'Desativar' : 'Ativar' }}
              </button>
            </div>
          </mat-card>

          <p class="muted" *ngIf="!filteredProfessors().length">Nenhum professor corresponde ao filtro atual.</p>
        </div>
      </section>

      <ng-template #loadingState>
        <div class="card-grid">
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
      grid-template-columns: 360px 1fr;
      gap: 20px;
      padding: 24px;
    }

    .form-panel,
    .list-panel,
    .professor-card,
    .skeleton-card {
      padding: 24px;
      border-radius: 28px;
    }

    .form,
    .professor-card {
      display: grid;
      gap: 16px;
    }

    .search-field {
      width: min(320px, 100%);
    }

    .compact-title {
      margin-bottom: 8px;
    }

    .card-header,
    .actions,
    .form-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
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
      min-height: 180px;
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
        grid-template-columns: 320px 1fr;
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
export class AdminProfessorsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly professorService = inject(ProfessorService);
  private readonly notificationService = inject(NotificationService);

  readonly professors = signal<Professor[]>([]);
  readonly editingProfessorId = signal<number | null>(null);
  readonly searchTerm = signal('');
  readonly loading = signal(true);
  readonly placeholders = Array.from({ length: 4 });
  readonly activeProfessorCount = computed(() => this.professors().filter((professor) => professor.ativo).length);
  readonly filteredProfessors = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.professors();
    }

    return this.professors().filter((professor) =>
      `${professor.nome} ${professor.email} ${professor.especialidade ?? ''}`.toLowerCase().includes(term)
    );
  });

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    especialidade: ['']
  });

  ngOnInit(): void {
    this.load();
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const professorId = this.editingProfessorId();
    const request = professorId
      ? this.professorService.updateProfessor(professorId, this.form.getRawValue())
      : this.professorService.createProfessor(this.form.getRawValue());

    request.subscribe({
      next: (professor) => {
        if (professorId) {
          this.professors.update((items) => items.map((item) => item.id === professor.id ? professor : item));
          this.notificationService.success('Professor atualizado com sucesso.');
        } else {
          this.professors.update((items) => [professor, ...items]);
          this.notificationService.success('Professor cadastrado com sucesso.');
        }

        this.cancelEdit();
      },
      error: (error) => this.notificationService.error(extractApiError(error))
    });
  }

  editProfessor(professor: Professor): void {
    this.editingProfessorId.set(professor.id);
    this.form.setValue({
      nome: professor.nome,
      email: professor.email,
      especialidade: professor.especialidade ?? ''
    });
  }

  cancelEdit(): void {
    this.editingProfessorId.set(null);
    this.form.reset({
      nome: '',
      email: '',
      especialidade: ''
    });
  }

  toggleProfessor(professor: Professor): void {
    if (professor.ativo) {
      this.professorService.deactivateProfessor(professor.id).subscribe({
        next: () => {
          this.professors.update((items) =>
            items.map((item) => item.id === professor.id ? { ...item, ativo: false } : item)
          );
          this.notificationService.success('Professor desativado com sucesso.');
        },
        error: (error: unknown) => this.notificationService.error(extractApiError(error))
      });
      return;
    }

    this.professorService.activateProfessor(professor.id).subscribe({
      next: (updated) => {
        this.professors.update((items) => items.map((item) => item.id === updated.id ? updated : item));
        this.notificationService.success('Professor ativado com sucesso.');
      },
      error: (error: unknown) => this.notificationService.error(extractApiError(error))
    });
  }

  private load(): void {
    this.professorService.listProfessorsForAdmin().subscribe({
      next: (professors) => {
        this.professors.set(professors);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error(extractApiError(error));
      }
    });
  }
}

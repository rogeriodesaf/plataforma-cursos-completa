import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CertificateService } from '../../core/services/certificate.service';
import { NotificationService } from '../../core/services/notification.service';
import { Certificado } from '../../core/models/course.models';
import { extractApiError } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-certificate-validation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  template: `
    <div class="validation-shell">
      <section class="hero panel">
        <img class="brand-mark" src="/logo-biblica.jpg" alt="Logo da plataforma">
        <span class="eyebrow">Validacao publica</span>
        <h1>Confirmar autenticidade do certificado</h1>
        <p class="muted">
          Consulte o codigo de validacao para verificar a emissao do certificado
          da plataforma Suporte de Aprendizado Biblico e Ensino Reformado.
        </p>

        <form class="search-row" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Codigo do certificado</mat-label>
            <input
              matInput
              [formControl]="codeControl"
              placeholder="Cole aqui o codigo de validacao">
          </mat-form-field>

          <button mat-flat-button class="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Consultando...' : 'Validar certificado' }}
          </button>
        </form>
      </section>

      <mat-card class="result-card" *ngIf="certificate() as currentCertificate; else emptyState">
        <div class="status-chip">
          <mat-icon>verified</mat-icon>
          <span>Certificado valido</span>
        </div>

        <div class="result-grid">
          <div>
            <span class="eyebrow">Aluno</span>
            <h2>{{ currentCertificate.nomeAluno }}</h2>
          </div>

          <div>
            <span class="eyebrow">Curso</span>
            <h3>{{ currentCertificate.tituloCurso }}</h3>
          </div>

          <div class="meta-block">
            <strong>Codigo de validacao</strong>
            <p>{{ currentCertificate.codigoValidacao }}</p>
          </div>

          <div class="meta-block">
            <strong>Data de emissao</strong>
            <p>{{ currentCertificate.dataEmissao | date:'dd/MM/yyyy HH:mm' }}</p>
          </div>
        </div>
      </mat-card>

      <ng-template #emptyState>
        <mat-card class="empty-card" *ngIf="!loading()">
          <mat-icon>fact_check</mat-icon>
          <h2>Informe um codigo para validar</h2>
          <p class="muted">Ao localizar um certificado valido, os dados do aluno e do curso aparecerao aqui.</p>
        </mat-card>
      </ng-template>
    </div>
  `,
  styles: [`
    .validation-shell {
      min-height: 100vh;
      padding: 24px;
      display: grid;
      gap: 20px;
      background:
        radial-gradient(circle at top left, rgba(214, 175, 82, 0.14), transparent 24%),
        linear-gradient(180deg, rgba(253, 248, 236, 0.94), rgba(244, 238, 224, 0.94));
    }

    .hero,
    .result-card,
    .empty-card {
      max-width: 1040px;
      width: 100%;
      margin: 0 auto;
    }

    .hero {
      padding: 28px;
      display: grid;
      gap: 16px;
      justify-items: start;
    }

    .hero h1,
    .result-card h2,
    .result-card h3,
    .empty-card h2 {
      margin: 0;
    }

    .brand-mark {
      width: 72px;
      height: 72px;
      border-radius: 24px;
      box-shadow: 0 16px 32px rgba(122, 92, 52, 0.16);
      object-fit: cover;
    }

    .search-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 14px;
      align-items: start;
    }

    .result-card,
    .empty-card {
      padding: 28px;
      border-radius: 28px;
      border: 1px solid rgba(122, 92, 52, 0.14);
      background: rgba(255, 252, 247, 0.92);
      box-shadow: 0 22px 42px rgba(81, 54, 25, 0.08);
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(38, 122, 80, 0.12);
      color: #1f6945;
      font-weight: 700;
    }

    .result-grid {
      display: grid;
      gap: 20px;
    }

    .meta-block {
      padding: 18px 20px;
      border-radius: 20px;
      background: linear-gradient(180deg, rgba(255, 249, 235, 0.98), rgba(247, 241, 225, 0.98));
      border: 1px solid rgba(157, 108, 34, 0.12);
    }

    .meta-block strong {
      display: block;
      margin-bottom: 8px;
    }

    .meta-block p,
    .empty-card p {
      margin: 0;
    }

    .empty-card {
      display: grid;
      justify-items: center;
      gap: 10px;
      text-align: center;
    }

    .empty-card mat-icon {
      width: 40px;
      height: 40px;
      font-size: 40px;
      color: var(--accent);
    }

    .primary {
      min-height: 56px;
    }

    @media (max-width: 760px) {
      .validation-shell {
        padding: 16px;
      }

      .hero,
      .result-card,
      .empty-card {
        padding: 20px;
      }

      .search-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CertificateValidationComponent implements OnInit {
  private readonly certificateService = inject(CertificateService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly codeControl = new FormControl('', { nonNullable: true });
  readonly certificate = signal<Certificado | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('codigo');
    if (code) {
      this.codeControl.setValue(code);
      this.lookup(code);
    }
  }

  submit(): void {
    const code = this.codeControl.value.trim();
    if (!code) {
      this.notificationService.error('Informe o codigo de validacao do certificado.');
      return;
    }

    void this.router.navigate(['/certificados/validacao', code]);
    this.lookup(code);
  }

  private lookup(code: string): void {
    this.loading.set(true);
    this.certificateService.validateCertificate(code).subscribe({
      next: (certificate) => {
        this.certificate.set(certificate);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.certificate.set(null);
        this.notificationService.error(extractApiError(error));
      }
    });
  }
}

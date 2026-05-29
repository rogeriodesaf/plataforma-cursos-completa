import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CourseService } from '../../core/services/course.service';
import { LessonService } from '../../core/services/lesson.service';
import { ProgressService } from '../../core/services/progress.service';
import { CertificateService } from '../../core/services/certificate.service';
import { NotificationService } from '../../core/services/notification.service';
import { Aula, Certificado, Curso, Progresso } from '../../core/models/course.models';
import { extractApiError } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatListModule, MatProgressBarModule],
  template: `
    <div class="course-shell" *ngIf="course() as currentCourse">
      <section class="course-hero reveal reveal-1" [style.--progress]="progress()?.percentual ?? 0">
        <div class="hero-copy">
          <span class="eyebrow">Experiencia do aluno</span>
          <h1>{{ currentCourse.titulo }}</h1>
          <p class="hero-text">{{ currentCourse.descricao }}</p>

          <div class="hero-pills" *ngIf="selectedLesson() as lesson">
            <span class="pill">Aula {{ lesson.ordem }} de {{ lessons().length }}</span>
            <span class="pill">{{ lesson.nomeProfessor }}</span>
            <span class="pill">{{ lesson.duracaoMinutos }} min</span>
          </div>
        </div>

        <div class="hero-progress" *ngIf="progress() as currentProgress">
          <div class="progress-ring">
            <strong>{{ currentProgress.percentual | number:'1.0-0' }}%</strong>
            <span>concluido</span>
          </div>

          <div class="hero-stats">
            <div>
              <small>Trilha</small>
              <strong>{{ currentProgress.aulasConcluidas }}/{{ currentProgress.totalAuLas }} aulas</strong>
            </div>
            <div>
              <small>Status</small>
              <strong>{{ currentProgress.percentual >= 100 ? 'Certificavel' : 'Em andamento' }}</strong>
            </div>
          </div>
        </div>
      </section>

      <div class="learning-layout">
        <section class="stage-panel reveal reveal-2" *ngIf="selectedLesson() as lesson">
          <div class="video-stage">
            <div class="video-frame">
              <iframe
                [src]="videoUrl()"
                title="Video da aula"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
              </iframe>
            </div>

            <div class="lesson-header">
              <div>
                <span class="eyebrow">Aula atual</span>
                <h2>{{ lesson.titulo }}</h2>
                <p class="muted">{{ lesson.descricao }}</p>
              </div>

              <div class="lesson-badges">
                <span class="pill">{{ isCompleted(lesson) ? 'Concluida' : 'Disponivel' }}</span>
                <span class="pill">{{ lesson.nomeProfessor }}</span>
                <span class="pill">{{ lesson.duracaoMinutos }} min</span>
              </div>
            </div>

            <div class="progress-panel" *ngIf="progress() as currentProgress">
              <div class="progress-overview">
                <div>
                  <small>Seu progresso</small>
                  <strong>{{ currentProgress.aulasConcluidas }}/{{ currentProgress.totalAuLas }} etapas finalizadas</strong>
                </div>
                <span class="percent">{{ currentProgress.percentual | number:'1.0-0' }}%</span>
              </div>

              <mat-progress-bar mode="determinate" [value]="currentProgress.percentual"></mat-progress-bar>

              <div class="actions">
                <button
                  mat-flat-button
                  class="primary action-main"
                  [disabled]="!canCompleteSelected()"
                  (click)="completeSelectedLesson()">
                  {{ isCompleted(lesson) ? 'Aula concluida' : 'Marcar como concluida' }}
                </button>

                <button
                  mat-stroked-button
                  class="action-secondary"
                  [disabled]="currentProgress.percentual < 100"
                  (click)="issueCertificate()">
                  Emitir certificado
                </button>
              </div>
            </div>

            <mat-card class="certificate-card" *ngIf="certificate() as currentCertificate">
              <div class="certificate-copy">
                <span class="eyebrow">Certificado emitido</span>
                <h3>{{ currentCertificate.tituloCurso }}</h3>
                <p class="muted">Aluno: {{ currentCertificate.nomeAluno }}</p>
                <p class="muted">Codigo: {{ currentCertificate.codigoValidacao }}</p>
                <p class="muted">Emissao: {{ currentCertificate.dataEmissao | date:'dd/MM/yyyy HH:mm' }}</p>

                <div class="certificate-actions">
                  <button mat-flat-button class="primary" type="button" (click)="downloadCertificatePdf(currentCertificate)">
                    Baixar PDF
                  </button>

                  <button mat-stroked-button class="action-secondary" type="button" (click)="printCertificate(currentCertificate)">
                    Abrir para imprimir / PDF
                  </button>

                  <a
                    mat-stroked-button
                    class="action-secondary validation-link"
                    [href]="buildValidationUrl(currentCertificate.codigoValidacao)"
                    target="_blank"
                    rel="noopener">
                    Validar certificado
                  </a>

                  <button mat-stroked-button class="action-secondary" type="button" (click)="saveCertificate(currentCertificate)">
                    Salvar HTML
                  </button>
                </div>
              </div>
              <mat-icon>workspace_premium</mat-icon>
            </mat-card>
          </div>
        </section>

        <aside class="curriculum-panel reveal reveal-3">
          <div class="curriculum-header">
            <div>
              <span class="eyebrow">Conteudo</span>
              <h2>Trilha do curso</h2>
            </div>
            <span class="pill">{{ lessons().length }} aulas</span>
          </div>

          <div class="curriculum-list">
            <button
              type="button"
              class="lesson-item"
              *ngFor="let lesson of lessons()"
              [class.active]="selectedLesson()?.id === lesson.id"
              [class.completed]="isCompleted(lesson)"
              [class.locked]="!isUnlocked(lesson)"
              (click)="selectLesson(lesson)">
              <div class="lesson-index">
                <mat-icon *ngIf="isCompleted(lesson)">task_alt</mat-icon>
                <mat-icon *ngIf="!isCompleted(lesson) && isUnlocked(lesson)">play_circle</mat-icon>
                <mat-icon *ngIf="!isUnlocked(lesson)">lock</mat-icon>
              </div>

              <div class="lesson-content">
                <strong>{{ lesson.ordem }}. {{ lesson.titulo }}</strong>
                <p>{{ lesson.nomeProfessor }}</p>
              </div>

              <span class="duration">{{ lesson.duracaoMinutos }} min</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .course-shell {
      min-height: 100%;
      display: grid;
      gap: 24px;
      padding: 24px;
      background:
        radial-gradient(circle at top left, rgba(214, 175, 82, 0.14), transparent 22%),
        linear-gradient(180deg, rgba(253, 248, 236, 0.92), rgba(244, 238, 224, 0.92));
    }

    .course-hero {
      display: grid;
      grid-template-columns: 1.4fr 0.8fr;
      gap: 20px;
      padding: 28px;
      border-radius: 30px;
      background:
        radial-gradient(circle at top right, rgba(255, 219, 145, 0.22), transparent 28%),
        linear-gradient(140deg, #1d130c, #5c3d1f 58%, #8f6331);
      color: #fffaf0;
      box-shadow: 0 24px 60px rgba(59, 34, 11, 0.24);
    }

    .hero-copy {
      display: grid;
      gap: 16px;
      align-content: center;
    }

    .hero-copy h1 {
      margin: 0;
      font-size: clamp(2.4rem, 4vw, 4.5rem);
      line-height: 0.96;
      max-width: 10ch;
    }

    .hero-text {
      margin: 0;
      max-width: 58ch;
      color: rgba(255, 250, 240, 0.78);
      font-size: 1.04rem;
    }

    .hero-pills,
    .lesson-badges {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .hero-progress {
      display: grid;
      align-content: center;
      gap: 16px;
      padding: 22px;
      border-radius: 24px;
      background: rgba(255, 248, 232, 0.1);
      border: 1px solid rgba(255, 248, 232, 0.16);
      backdrop-filter: blur(10px);
    }

    .progress-ring {
      display: grid;
      place-items: center;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background:
        radial-gradient(circle, rgba(34, 22, 13, 0.88) 44%, transparent 46%),
        conic-gradient(#f5d07e 0deg, #f5d07e calc((var(--progress, 0)) * 3.6deg), rgba(255, 255, 255, 0.18) 0deg);
      justify-self: end;
    }

    .progress-ring strong {
      font-size: 2rem;
    }

    .progress-ring span,
    .hero-stats small,
    .progress-overview small {
      color: rgba(255, 250, 240, 0.72);
    }

    .hero-stats {
      display: grid;
      gap: 12px;
      justify-items: end;
    }

    .hero-stats strong {
      display: block;
      margin-top: 4px;
      font-size: 1.05rem;
    }

    .learning-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.5fr) 380px;
      gap: 20px;
    }

    .stage-panel,
    .curriculum-panel,
    .certificate-card {
      border-radius: 28px;
      background: rgba(255, 252, 247, 0.9);
      border: 1px solid rgba(122, 92, 52, 0.14);
      box-shadow: 0 22px 42px rgba(81, 54, 25, 0.08);
    }

    .video-stage,
    .curriculum-panel {
      display: grid;
      gap: 18px;
      padding: 24px;
    }

    .curriculum-header,
    .progress-overview,
    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .curriculum-list {
      display: grid;
      gap: 12px;
    }

    .lesson-item {
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 246, 237, 0.94));
      border-radius: 20px;
      padding: 16px;
      min-height: 92px;
      display: grid;
      grid-template-columns: 48px 1fr auto;
      gap: 14px;
      align-items: center;
      text-align: left;
      color: inherit;
      cursor: pointer;
      transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }

    .lesson-item:hover {
      transform: translateY(-2px);
      border-color: rgba(137, 102, 45, 0.34);
      box-shadow: 0 16px 28px rgba(68, 44, 18, 0.08);
    }

    .lesson-index {
      width: 48px;
      height: 48px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(236, 224, 201, 0.76);
      color: #6f4b1f;
    }

    .lesson-content strong {
      display: block;
      margin-bottom: 6px;
      font-size: 0.98rem;
    }

    .lesson-content p {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 0.92rem;
    }

    .duration {
      color: var(--muted);
      font-weight: 700;
      white-space: nowrap;
    }

    .lesson-item.active {
      border-color: rgba(131, 86, 25, 0.42);
      background: linear-gradient(180deg, rgba(255, 248, 231, 0.98), rgba(247, 235, 207, 0.98));
      transform: translateX(4px);
    }

    .lesson-item.completed .lesson-index {
      background: rgba(30, 107, 67, 0.14);
      color: #1a6e45;
    }

    .lesson-item.locked {
      opacity: 0.62;
    }

    .video-frame {
      aspect-ratio: 16 / 9;
      border-radius: 26px;
      overflow: hidden;
      background:
        radial-gradient(circle at top left, rgba(255, 214, 132, 0.08), transparent 24%),
        #050505;
      box-shadow: 0 20px 42px rgba(8, 8, 8, 0.26);
    }

    iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }

    .lesson-header {
      display: grid;
      gap: 16px;
    }

    .lesson-header h2,
    .certificate-copy h3,
    .curriculum-header h2 {
      margin: 0;
    }

    .progress-panel {
      display: grid;
      gap: 14px;
      padding: 18px 20px;
      border-radius: 22px;
      background: linear-gradient(180deg, rgba(247, 241, 229, 0.95), rgba(255, 255, 255, 0.95));
      border: 1px solid rgba(142, 109, 57, 0.12);
    }

    .percent {
      font-size: 1.4rem;
      font-weight: 800;
      color: #704719;
    }

    .primary {
      background: var(--primary);
      color: #fff;
    }

    .action-main,
    .action-secondary {
      min-height: 50px;
      border-radius: 14px;
    }

    .certificate-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      padding: 22px 24px;
      background:
        radial-gradient(circle at top right, rgba(247, 204, 106, 0.2), transparent 28%),
        linear-gradient(145deg, rgba(255, 249, 235, 0.98), rgba(247, 241, 225, 0.98));
    }

    .certificate-card mat-icon {
      font-size: 42px;
      width: 42px;
      height: 42px;
      color: #9d6c22;
    }

    .certificate-actions {
      margin-top: 14px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
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

    @media (max-width: 1080px) {
      .course-hero,
      .learning-layout {
        grid-template-columns: 1fr;
      }

      .hero-progress,
      .hero-stats {
        justify-items: start;
      }

      .progress-ring {
        justify-self: start;
      }
    }

    @media (max-width: 760px) {
      .course-shell {
        padding: 16px;
      }

      .course-hero,
      .video-stage,
      .curriculum-panel {
        padding: 18px;
      }

      .lesson-item {
        grid-template-columns: 44px 1fr;
      }

      .duration {
        grid-column: 2;
      }
    }
  `]
})
export class CoursePlayerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly courseService = inject(CourseService);
  private readonly lessonService = inject(LessonService);
  private readonly progressService = inject(ProgressService);
  private readonly certificateService = inject(CertificateService);
  private readonly notificationService = inject(NotificationService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly course = signal<Curso | null>(null);
  readonly lessons = signal<Aula[]>([]);
  readonly progress = signal<Progresso | null>(null);
  readonly selectedLesson = signal<Aula | null>(null);
  readonly certificate = signal<Certificado | null>(null);

  readonly videoUrl = computed<SafeResourceUrl | null>(() => {
    const lesson = this.selectedLesson();
    return lesson ? this.sanitizer.bypassSecurityTrustResourceUrl(lesson.urlVideo) : null;
  });

  ngOnInit(): void {
    const courseId = Number(this.route.snapshot.paramMap.get('courseId'));
    this.load(courseId);
  }

  isCompleted(lesson: Aula): boolean {
    return lesson.ordem <= (this.progress()?.aulasConcluidas ?? 0);
  }

  isUnlocked(lesson: Aula): boolean {
    return lesson.ordem <= ((this.progress()?.aulasConcluidas ?? 0) + 1);
  }

  selectLesson(lesson: Aula): void {
    if (!this.isUnlocked(lesson)) {
      this.notificationService.error('Conclua as aulas anteriores para liberar esta etapa.');
      return;
    }

    this.selectedLesson.set(lesson);
  }

  canCompleteSelected(): boolean {
    const lesson = this.selectedLesson();
    return !!lesson && this.isUnlocked(lesson) && !this.isCompleted(lesson);
  }

  completeSelectedLesson(): void {
    const lesson = this.selectedLesson();
    const courseId = this.course()?.id;
    if (!lesson || !courseId) {
      return;
    }

    this.progressService.completeLesson(lesson.id).subscribe({
      next: () => {
        this.notificationService.success('Aula concluida com sucesso.');
        this.refreshProgress(courseId, lesson.ordem + 1);
      },
      error: (error) => this.notificationService.error(extractApiError(error))
    });
  }

  issueCertificate(): void {
    const courseId = this.course()?.id;
    if (!courseId) {
      return;
    }

    this.certificateService.issueCertificate(courseId).subscribe({
      next: (certificate) => {
        this.certificate.set(certificate);
        this.notificationService.success('Certificado emitido com sucesso.');
      },
      error: (error) => this.notificationService.error(extractApiError(error))
    });
  }

  saveCertificate(certificate: Certificado): void {
    const html = this.buildCertificateHtml(certificate);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `certificado-${this.slugify(certificate.tituloCurso)}.html`;
    link.click();
    URL.revokeObjectURL(url);

    this.notificationService.success('Certificado salvo no computador.');
  }

  downloadCertificatePdf(certificate: Certificado): void {
    const courseId = this.course()?.id;
    if (!courseId) {
      return;
    }

    this.certificateService.downloadCertificatePdf(courseId).subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');

        link.href = url;
        link.download = `certificado-${this.slugify(certificate.tituloCurso)}.pdf`;
        link.click();
        URL.revokeObjectURL(url);

        this.notificationService.success('PDF do certificado baixado com sucesso.');
      },
      error: (error) => this.notificationService.error(extractApiError(error))
    });
  }

  printCertificate(certificate: Certificado): void {
    const html = this.buildCertificateHtml(certificate, true);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (!printWindow) {
      URL.revokeObjectURL(url);
      this.notificationService.error('Nao foi possivel abrir a janela de impressao.');
      return;
    }

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  }

  private load(courseId: number): void {
    forkJoin({
      course: this.courseService.getCourse(courseId),
      lessons: this.lessonService.listByCourse(courseId),
      progress: this.progressService.getCourseProgress(courseId)
    }).subscribe({
      next: ({ course, lessons, progress }) => {
        const orderedLessons = [...lessons].sort((left, right) => left.ordem - right.ordem);
        this.course.set(course);
        this.lessons.set(orderedLessons);
        this.progress.set(progress);
        this.selectedLesson.set(
          orderedLessons.find((lesson) => this.isUnlocked(lesson) && !this.isCompleted(lesson))
          ?? orderedLessons[0]
          ?? null
        );
      },
      error: (error) => this.notificationService.error(extractApiError(error))
    });
  }

  private refreshProgress(courseId: number, nextOrder: number): void {
    this.progressService.getCourseProgress(courseId).subscribe({
      next: (progress) => {
        this.progress.set(progress);
        const nextLesson = this.lessons().find((lesson) => lesson.ordem === nextOrder)
          ?? this.selectedLesson();
        if (nextLesson && this.isUnlocked(nextLesson)) {
          this.selectedLesson.set(nextLesson);
        }
      },
      error: (error) => this.notificationService.error(extractApiError(error))
    });
  }

  private buildCertificateHtml(certificate: Certificado, autoPrint = false): string {
    const emissionDate = new Date(certificate.dataEmissao).toLocaleString('pt-BR');
    const logoUrl = `${window.location.origin}/logo-biblica.jpg`;

    return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <title>Certificado - ${certificate.tituloCurso}</title>
    <style>
      body {
        margin: 0;
        font-family: Georgia, serif;
        background: #f7f1e7;
        color: #2c1b12;
      }
      .sheet {
        max-width: 960px;
        margin: 32px auto;
        padding: 56px;
        background:
          radial-gradient(circle at top right, rgba(247, 214, 142, 0.28), transparent 24%),
          linear-gradient(180deg, #fffaf0, #f4e9d2);
        border: 12px solid #9d6c22;
        border-radius: 30px;
        box-shadow: 0 24px 60px rgba(61, 35, 12, 0.15);
        position: relative;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: #9d6c22;
        font-size: 12px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 18px;
        margin-bottom: 28px;
      }
      .brand img {
        width: 72px;
        height: 72px;
        border-radius: 24px;
        object-fit: cover;
      }
      .seal {
        position: absolute;
        top: 34px;
        right: 34px;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 2px solid rgba(157, 108, 34, 0.34);
        display: grid;
        place-items: center;
        text-align: center;
        color: #9d6c22;
        font-size: 12px;
        line-height: 1.4;
        background: rgba(255, 250, 240, 0.78);
      }
      h1 {
        margin: 12px 0;
        font-size: 48px;
      }
      h2 {
        margin: 8px 0 24px;
        font-size: 38px;
      }
      p {
        font-size: 18px;
        line-height: 1.6;
      }
      .statement {
        font-size: 21px;
      }
      .signature-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 36px;
        margin-top: 48px;
      }
      .signature {
        padding-top: 14px;
        border-top: 1px solid rgba(61, 35, 12, 0.28);
        text-align: center;
      }
      .meta {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid rgba(61, 35, 12, 0.18);
      }
      .meta strong {
        display: block;
        margin-bottom: 8px;
      }
      @media print {
        body {
          background: #fff;
        }
        .sheet {
          box-shadow: none;
          margin: 0;
          max-width: none;
        }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <div class="seal">CERTIFICADO<br>OFICIAL</div>
      <div class="brand">
        <img src="${logoUrl}" alt="Logo da plataforma">
        <div>
          <div class="eyebrow">Plataforma academica</div>
          <strong>Suporte de Aprendizado Biblico e Ensino Reformado</strong>
        </div>
      </div>
      <div class="eyebrow">Certificado de conclusao</div>
      <h1>Suporte de Aprendizado Biblico e Ensino Reformado</h1>
      <p>Certificamos que</p>
      <h2>${certificate.nomeAluno}</h2>
      <p class="statement">concluiu com aproveitamento o curso <strong>${certificate.tituloCurso}</strong>.</p>

      <section class="signature-row">
        <div class="signature">
          <strong>Coordenacao Academica</strong>
        </div>
        <div class="signature">
          <strong>Direcao da Plataforma</strong>
        </div>
      </section>

      <section class="meta">
        <strong>Codigo de validacao</strong>
        <p>${certificate.codigoValidacao}</p>
        <strong>Data de emissao</strong>
        <p>${emissionDate}</p>
      </section>
    </main>
    ${autoPrint ? '<script>window.onload = () => setTimeout(() => window.print(), 250);</script>' : ''}
  </body>
</html>`;
  }

  buildValidationUrl(codigoValidacao: string): string {
    return `/certificados/validacao/${encodeURIComponent(codigoValidacao)}`;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

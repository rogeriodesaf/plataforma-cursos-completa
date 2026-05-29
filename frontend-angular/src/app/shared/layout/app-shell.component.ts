import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, MatButtonModule, MatIconModule],
  template: `
    <div class="shell" [class.nav-open]="navOpen()">
      <header class="topbar panel">
        <button mat-icon-button type="button" class="menu-toggle" (click)="toggleNav()">
          <mat-icon>{{ navOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>

        <div class="topbar-copy">
          <span class="eyebrow">Plataforma</span>
          <strong>Ensino Reformado</strong>
        </div>

        <button mat-flat-button class="logout topbar-logout" (click)="logout()">Sair</button>
      </header>

      <div class="nav-backdrop" *ngIf="navOpen()" (click)="closeNav()"></div>

      <aside class="sidebar panel">
        <div class="brand">
          <span class="eyebrow">Plataforma</span>
          <h1>Suporte de Aprendizado Biblico e Ensino Reformado</h1>
          <p class="muted">Trilhas formativas, progresso guiado e gestao centralizada para a plataforma.</p>
        </div>

        <nav class="nav">
          <a
            *ngFor="let item of navItems()"
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-link"
            (click)="closeNav()">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <div class="profile panel">
          <p class="eyebrow">Sessao</p>
          <strong class="session-email">{{ authService.profile()?.email }}</strong>
          <span class="session-role">{{ profileLabel() }}</span>
          <button mat-flat-button class="logout" (click)="logout()">Sair</button>
        </div>
      </aside>

      <main class="content">
        <div class="content-body">
          <router-outlet />
        </div>

        <footer class="app-footer">
          desenvolvido por Rogerio de Sa - Analista de Sistemas @2026
        </footer>
      </main>
    </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: 272px 1fr;
      min-height: 100vh;
      gap: 20px;
      padding: 20px;
    }

    .topbar,
    .nav-backdrop {
      display: none;
    }

    .topbar {
      align-items: center;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      padding: 12px 14px;
      position: sticky;
      top: 12px;
      z-index: 30;
    }

    .topbar-copy {
      display: grid;
      gap: 2px;
    }

    .topbar-copy strong {
      font-size: 1rem;
      line-height: 1;
    }

    .menu-toggle {
      color: var(--primary);
    }

    .topbar-logout {
      min-width: 72px;
    }

    .sidebar {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      position: sticky;
      top: 20px;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
    }

    .brand h1 {
      margin-top: 8px;
      font-size: 1.74rem;
      line-height: 0.98;
      max-width: 12ch;
    }

    .nav {
      display: grid;
      gap: 10px;
      flex: 1 1 auto;
      align-content: start;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 18px;
      text-decoration: none;
      color: var(--ink);
      background: rgba(255, 255, 255, 0.48);
      transition: transform 180ms ease, background 180ms ease;
    }

    .nav-link:hover,
    .nav-link.active {
      background: var(--primary);
      color: #fff;
      transform: translateX(4px);
    }

    .profile {
      margin-top: auto;
      padding: 16px;
      display: grid;
      gap: 12px;
      flex-shrink: 0;
      align-content: start;
      justify-items: start;
    }

    .logout {
      background: var(--accent);
      color: #fff;
    }

    .session-email {
      line-break: anywhere;
    }

    .session-role {
      font-size: 0.92rem;
      color: var(--muted);
    }

    .content {
      min-width: 0;
      display: grid;
      grid-template-rows: 1fr auto;
      gap: 16px;
    }

    .content-body {
      min-width: 0;
    }

    .app-footer {
      padding: 0 10px 8px;
      color: var(--muted);
      font-size: 0.88rem;
      text-align: center;
    }

    @media (max-width: 1240px) {
      .shell {
        grid-template-columns: 248px 1fr;
      }

      .brand h1 {
        font-size: 1.58rem;
      }
    }

    @media (max-width: 1024px) {
      .shell {
        grid-template-columns: 1fr;
        padding-top: 12px;
      }

      .topbar {
        display: grid;
      }

      .nav-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(16, 10, 6, 0.26);
        z-index: 25;
      }

      .sidebar {
        position: fixed;
        top: 76px;
        left: 12px;
        right: 12px;
        bottom: 12px;
        max-height: none;
        overflow-y: auto;
        z-index: 40;
        transform: translateY(-16px);
        opacity: 0;
        pointer-events: none;
        transition: transform 180ms ease, opacity 180ms ease;
      }

      .shell.nav-open .sidebar {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }

      .profile {
        position: sticky;
        bottom: 0;
        background: rgba(255, 252, 246, 0.98);
      }
    }
  `]
})
export class AppShellComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly navOpen = signal(false);
  readonly profileLabel = computed(() => (
    this.authService.hasRole('ADMIN') ? 'Administrador' : 'Aluno'
  ));

  readonly navItems = computed<NavItem[]>(() => (
    this.authService.hasRole('ADMIN')
      ? [
          { label: 'Dashboard', icon: 'space_dashboard', route: '/admin/dashboard' },
          { label: 'Cursos', icon: 'library_books', route: '/admin/cursos' },
          { label: 'Aulas', icon: 'play_circle', route: '/admin/aulas' },
          { label: 'Professores', icon: 'groups', route: '/admin/professores' }
        ]
      : [
          { label: 'Dashboard', icon: 'insights', route: '/aluno/dashboard' },
          { label: 'Cursos', icon: 'menu_book', route: '/aluno/cursos' }
        ]
  ));

  logout(): void {
    this.closeNav();
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  toggleNav(): void {
    this.navOpen.update((value) => !value);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }
}

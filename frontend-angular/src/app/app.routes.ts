import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password.component';
import { AppShellComponent } from './shared/layout/app-shell.component';
import { StudentDashboardComponent } from './features/student/student-dashboard.component';
import { CourseCatalogComponent } from './features/courses/course-catalog.component';
import { CoursePlayerComponent } from './features/courses/course-player.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { AdminCoursesComponent } from './features/admin/admin-courses.component';
import { AdminLessonsComponent } from './features/admin/admin-lessons.component';
import { AdminProfessorsComponent } from './features/admin/admin-professors.component';
import { CertificateValidationComponent } from './features/certificates/certificate-validation.component';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'esqueci-minha-senha', component: ForgotPasswordComponent },
  { path: 'redefinir-senha/:token', component: ResetPasswordComponent },
  { path: 'certificados/validacao', component: CertificateValidationComponent },
  { path: 'certificados/validacao/:codigo', component: CertificateValidationComponent },
  {
    path: 'aluno',
    component: AppShellComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['USER'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: StudentDashboardComponent },
      { path: 'cursos', component: CourseCatalogComponent },
      { path: 'cursos/:courseId/aulas', component: CoursePlayerComponent }
    ]
  },
  {
    path: 'admin',
    component: AppShellComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'cursos', component: AdminCoursesComponent },
      { path: 'aulas', component: AdminLessonsComponent },
      { path: 'professores', component: AdminProfessorsComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

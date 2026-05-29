import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Curso, CursoPayload } from '../models/course.models';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);

  listCourses(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${environment.apiUrl}/cursos`);
  }

  getCourse(id: number): Observable<Curso> {
    return this.http.get<Curso>(`${environment.apiUrl}/cursos/${id}`);
  }

  createCourse(payload: CursoPayload): Observable<Curso> {
    return this.http.post<Curso>(`${environment.apiUrl}/cursos`, payload);
  }

  updateCourse(id: number, payload: CursoPayload): Observable<Curso> {
    return this.http.put<Curso>(`${environment.apiUrl}/cursos/${id}/atualizar`, payload);
  }

  deactivateCourse(id: number): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/cursos/${id}/desativar`, {});
  }

  activateCourse(id: number): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/cursos/${id}/ativar`, {});
  }
}

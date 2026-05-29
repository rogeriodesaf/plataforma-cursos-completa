import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Certificado } from '../models/course.models';

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private readonly http = inject(HttpClient);

  issueCertificate(cursoId: number): Observable<Certificado> {
    return this.http.post<Certificado>(`${environment.apiUrl}/certificados/cursos/${cursoId}`, {});
  }

  downloadCertificatePdf(cursoId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/certificados/cursos/${cursoId}/pdf`, {
      responseType: 'blob'
    });
  }

  validateCertificate(codigo: string): Observable<Certificado> {
    return this.http.get<Certificado>(`${environment.apiUrl}/certificados/validacao/${encodeURIComponent(codigo)}`);
  }
}

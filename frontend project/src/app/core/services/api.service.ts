import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    loading = signal(false);
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    get<T>(path: string, params?: Record<string, string | number>): Observable<T> {
        this.loading.set(true);
        let httpParams = new HttpParams();
        if (params) {
            Object.entries(params).forEach(([key, val]) => {
                httpParams = httpParams.set(key, String(val));
            });
        }
        return this.http.get<T>(`${this.baseUrl}${path}`, { params: httpParams }).pipe(
            catchError(err => this.handleError(err)),
            finalize(() => this.loading.set(false))
        );
    }

    post<T>(path: string, body: any): Observable<T> {
        this.loading.set(true);
        return this.http.post<T>(`${this.baseUrl}${path}`, body).pipe(
            catchError(err => this.handleError(err)),
            finalize(() => this.loading.set(false))
        );
    }

    put<T>(path: string, body: any): Observable<T> {
        this.loading.set(true);
        return this.http.put<T>(`${this.baseUrl}${path}`, body).pipe(
            catchError(err => this.handleError(err)),
            finalize(() => this.loading.set(false))
        );
    }

    delete<T>(path: string): Observable<T> {
        this.loading.set(true);
        return this.http.delete<T>(`${this.baseUrl}${path}`).pipe(
            catchError(err => this.handleError(err)),
            finalize(() => this.loading.set(false))
        );
    }

    private handleError(error: any) {
        console.error('API Error:', error);
        return throwError(() => error);
    }
}

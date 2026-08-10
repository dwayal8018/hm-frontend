import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // ONLY logout when cloud backend explicitly returns 401 (invalid/expired token).
      // status 0   = network error / CORS block from local backend — never logout
      // status 403 = forbidden (not an auth issue) — never logout
      // status 401 from localApiUrl = local backend config issue — never logout
      const isCloudRequest = req.url.startsWith(environment.cloudApiUrl);
      if (error.status === 401 && isCloudRequest) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};

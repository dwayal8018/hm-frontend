import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { environment } from '../environments/environment';
import { demoInterceptor } from './core/demo/demo.interceptor';

// In demo mode the demo interceptor runs FIRST so it short-circuits every /api
// call with seeded data before the auth interceptor's error handling. In
// production/dev the demo interceptor is not registered at all.
const interceptors: HttpInterceptorFn[] = environment.demoMode
  ? [demoInterceptor, authInterceptor]
  : [authInterceptor];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors(interceptors)),
    provideAnimationsAsync()
  ]
};

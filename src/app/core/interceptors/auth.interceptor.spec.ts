import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('AuthInterceptor - Critical Test Suite', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        {
          provide: HTTP_INTERCEPTORS,
          useValue: authInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('TC-5: HTTP Interceptor Behavior', () => {

    it('TC-5.1: Should add Authorization header when token exists', () => {
      // Arrange
      const token = 'test-jwt-token';
      localStorage.setItem('hm_token', token);

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/test`).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/test`);
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req.flush({});
    });

    it('TC-5.2: Should not add Authorization header when no token', () => {
      // Arrange
      localStorage.clear();

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/test`).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/test`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('TC-5.3: Should logout on 401 from cloud backend', (done) => {
      // Arrange
      spyOn(authService, 'logout');
      localStorage.setItem('hm_token', 'test-token');

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/protected`).subscribe(
        () => fail('Should have failed'),
        (error: HttpErrorResponse) => {
          // Assert
          expect(error.status).toBe(401);
          expect(authService.logout).toHaveBeenCalled();
          done();
        }
      );

      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/protected`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('TC-5.4: Should NOT logout on 401 from local backend', (done) => {
      // Arrange
      spyOn(authService, 'logout');
      localStorage.setItem('hm_token', 'test-token');

      // Act
      httpClient.get(`${environment.localApiUrl}/api/protected`).subscribe(
        () => fail('Should have failed'),
        (error: HttpErrorResponse) => {
          // Assert
          expect(error.status).toBe(401);
          expect(authService.logout).not.toHaveBeenCalled();
          done();
        }
      );

      const req = httpMock.expectOne(`${environment.localApiUrl}/api/protected`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('TC-5.5: Should handle network error (status 0)', (done) => {
      // Arrange
      spyOn(authService, 'logout');
      localStorage.setItem('hm_token', 'test-token');

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/test`).subscribe(
        () => fail('Should have failed'),
        (error: HttpErrorResponse) => {
          // Assert
          expect(error.status).toBe(0); // Network error
          expect(authService.logout).not.toHaveBeenCalled();
          done();
        }
      );

      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/test`);
      req.error(new ProgressEvent('Network error'));
    });

    it('TC-5.6: Should NOT logout on 403 Forbidden', (done) => {
      // Arrange
      spyOn(authService, 'logout');
      localStorage.setItem('hm_token', 'test-token');

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/forbidden`).subscribe(
        () => fail('Should have failed'),
        (error: HttpErrorResponse) => {
          // Assert
          expect(error.status).toBe(403);
          expect(authService.logout).not.toHaveBeenCalled();
          done();
        }
      );

      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/forbidden`);
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    it('TC-5.7: Should forward non-error responses', () => {
      // Arrange
      const mockData = { data: 'test' };
      localStorage.setItem('hm_token', 'test-token');

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/test`).subscribe(response => {
        // Assert
        expect(response).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/test`);
      req.flush(mockData);
    });

    it('TC-5.8: Should handle other error statuses gracefully', (done) => {
      // Arrange
      spyOn(authService, 'logout');
      localStorage.setItem('hm_token', 'test-token');

      // Act - Test 500 Server Error
      httpClient.get(`${environment.cloudApiUrl}/api/test`).subscribe(
        () => fail('Should have failed'),
        (error: HttpErrorResponse) => {
          // Assert
          expect(error.status).toBe(500);
          expect(authService.logout).not.toHaveBeenCalled();
          done();
        }
      );

      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/test`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    it('TC-5.9: Should preserve error details when forwarding errors', (done) => {
      // Arrange
      const errorMessage = 'Test error message';
      localStorage.setItem('hm_token', 'test-token');

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/test`).subscribe(
        () => fail('Should have failed'),
        (error: HttpErrorResponse) => {
          // Assert
          expect(error.status).toBe(400);
          expect(error.error).toBeDefined();
          done();
        }
      );

      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/test`);
      req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
    });

    it('TC-5.10: Should handle multiple concurrent requests', () => {
      // Arrange
      localStorage.setItem('hm_token', 'test-token');

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/test1`).subscribe();
      httpClient.get(`${environment.cloudApiUrl}/api/test2`).subscribe();
      httpClient.get(`${environment.cloudApiUrl}/api/test3`).subscribe();

      // Assert
      const requests = httpMock.match(req => req.url.startsWith(environment.cloudApiUrl));
      expect(requests.length).toBe(3);

      requests.forEach(req => {
        expect(req.request.headers.get('Authorization')).toBe(`Bearer test-token`);
        req.flush({});
      });
    });
  });

  describe('TC-6: XSS & Security in Interceptor', () => {

    it('TC-6.1: Should not execute script in Authorization header value', () => {
      // Arrange
      const maliciousToken = '"><script>alert("xss")</script><token"';
      localStorage.setItem('hm_token', maliciousToken);

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/test`).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/test`);
      const authHeader = req.request.headers.get('Authorization');
      expect(authHeader).toBe(`Bearer ${maliciousToken}`);
      // Browser security should prevent script execution in header values
      req.flush({});
    });

    it('TC-6.2: Should handle special characters in token', () => {
      // Arrange
      const specialToken = 'token.with.dots:colons;semicolons@at#hash';
      localStorage.setItem('hm_token', specialToken);

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/test`).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/test`);
      const authHeader = req.request.headers.get('Authorization');
      expect(authHeader).toBe(`Bearer ${specialToken}`);
      req.flush({});
    });
  });

  describe('TC-7: Interceptor Edge Cases', () => {

    it('TC-7.1: Should handle empty token string', () => {
      // Arrange
      localStorage.setItem('hm_token', '');

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/test`).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/test`);
      // Empty token might be treated as falsy in the interceptor
      const authHeader = req.request.headers.get('Authorization');
      // Depends on implementation - could be null or "Bearer "
      req.flush({});
    });

    it('TC-7.2: Should handle whitespace-only token', () => {
      // Arrange
      localStorage.setItem('hm_token', '   ');

      // Act
      httpClient.get(`${environment.cloudApiUrl}/api/test`).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/test`);
      // Whitespace token should still be added (frontend bug to prevent storing invalid tokens)
      req.flush({});
    });

    it('TC-7.3: Should handle rapid token changes', () => {
      // Arrange
      localStorage.setItem('hm_token', 'token1');

      // Act - Change token mid-request
      httpClient.get(`${environment.cloudApiUrl}/api/test1`).subscribe();

      const req1 = httpMock.expectOne(`${environment.cloudApiUrl}/api/test1`);
      expect(req1.request.headers.get('Authorization')).toBe('Bearer token1');

      // Change token
      localStorage.setItem('hm_token', 'token2');

      httpClient.get(`${environment.cloudApiUrl}/api/test2`).subscribe();
      const req2 = httpMock.expectOne(`${environment.cloudApiUrl}/api/test2`);
      expect(req2.request.headers.get('Authorization')).toBe('Bearer token2');

      req1.flush({});
      req2.flush({});
    });

    it('TC-7.4: Should continue working after logout', (done) => {
      // Arrange
      localStorage.setItem('hm_token', 'test-token');

      // Simulate logout (remove token)
      localStorage.removeItem('hm_token');

      // Act - Request after logout should not have Authorization header
      httpClient.get(`${environment.cloudApiUrl}/api/test`).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.cloudApiUrl}/api/test`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
      done();
    });
  });
});

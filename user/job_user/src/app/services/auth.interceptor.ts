import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';



@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Danh sách các endpoint không cần token (phải khớp với SecurityConfig)
    const permittedPaths = [
      '/user/login', '/user/register', '/user/findByEmail', '/user/findById', '/job-static', '/user-static', '/python',
      '/job/findAll', '/job/category', '/job/experience', '/job/findAllPagination',
      '/job/findById', '/job/findByEmployerIdPagination', '/job/worktype',
      '/job/reviews', '/job/location/findAll', '/job/searchJobs', '/notification', "/application/auth-url", "/application/check-auth",
      "/application/oauth-callback", "/application/create-event", "/application/save-event", "/application/get-saved-event", "/user-static/", "/assets/", "/user/employer/get-large-companies/",
      "https://provinces.open-api.vn/api/**", "/user/chat", '/user/google-login/**', '/user/**',
    ];

    // Lấy URL từ request và loại bỏ query parameters
    const url = request.url.split('?')[0];
    const path = url.replace('http://103.153.68.231:8080', '');
    console.log(`Intercepting request to URL: ${url}, Path: ${path}`);

    // Kiểm tra xem path có nằm trong danh sách permitAll không
    const isPermitted = permittedPaths.some(permittedPath => {
      if (permittedPath.endsWith('/**')) {
        const prefix = permittedPath.substring(0, permittedPath.length - 3);
        return path.startsWith(prefix);
      }
      return path === permittedPath || path.startsWith(permittedPath + '/');
    });

    console.log(`Is Permitted: ${isPermitted}, Path: ${path}`);

    // Nếu không phải endpoint permitAll, thêm token vào header
    if (!isPermitted) {
      const token = localStorage.getItem('token');
      console.log(`Token to be added: ${token}`);
      if (token) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Token added to header:', request.headers.get('Authorization'));
      } else {
        console.warn('No token available for request requiring authorization');
      }
    } else {
      console.log('Skipping token for permitted endpoint');
    }

    return next.handle(request);
  }
}
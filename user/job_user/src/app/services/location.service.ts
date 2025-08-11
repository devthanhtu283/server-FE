import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';
import { BaseUrl } from './baseUrl.service';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  constructor(private http: HttpClient, private baseUrl: BaseUrl) {}

  async getProvinces(): Promise<any> {
    return await lastValueFrom(this.http.get(this.baseUrl.getLocationUrl() + '/p'));
  }

  async getDistricts(provinceId: number): Promise<any> {
    return await lastValueFrom(this.http.get(this.baseUrl.getLocationUrl() + '/d/' + provinceId));
  }

  async getWards(districtId: number): Promise<any> {
    return await lastValueFrom(this.http.get(this.baseUrl.getLocationUrl() + '/w/' + districtId));
  }

  async getAllDistricts(): Promise<any> {
    return await lastValueFrom(this.http.get(this.baseUrl.getLocationUrl() + '/d'));
  }

  async getAllWards(): Promise<any> {
    return await lastValueFrom(this.http.get(this.baseUrl.getLocationUrl() + '/w'));
  }
}

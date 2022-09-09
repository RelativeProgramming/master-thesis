import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SERVER_API_URL } from 'src/constants';
import { Product } from 'src/model/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  getAllProducts(): Observable<HttpResponse<Product[]>> {
    return this.http.get<Product[]>(SERVER_API_URL + '/products', {
      observe: 'response',
    });
  }

  constructor(private http: HttpClient) {}
}

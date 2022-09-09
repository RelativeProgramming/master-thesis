import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SERVER_API_URL } from 'src/constants';
import { OrderConfirmation } from 'src/model/order-confirmation.model';
import { Order } from 'src/model/order.model';
@Injectable({
  providedIn: 'root',
})
export class OrderService {
  saveOrder(order: Order): Observable<HttpResponse<OrderConfirmation>> {
    return this.http
      .post<OrderConfirmation>(SERVER_API_URL + '/order', order, {
        observe: 'response',
      })
      .pipe(
        map((data) => {
          if (data.body) {
            data.body.dateCreated = new Date(data.body.dateCreated);
          }
          return data;
        })
      );
  }

  constructor(private http: HttpClient) {}
}

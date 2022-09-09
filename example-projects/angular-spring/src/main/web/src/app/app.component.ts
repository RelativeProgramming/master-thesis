import { Component, OnInit } from '@angular/core';
import { OrderItem } from '../model/order-item.model';
import { Order } from '../model/order.model';
import { Product } from '../model/product.model';
import { OrderService } from '../service/order.service';
import { ProductService } from '../service/product.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'demo-app';

  public orderItems: OrderItem[] = [];
  public products: Product[] = [];
  public message?: string;

  public add1ToCart(productId: number) {
    const orderItem = this.orderItems.find((oi) => oi.productId === productId);
    if (orderItem) {
      orderItem.quantity += 1;
    } else {
      this.orderItems.push(new OrderItem(productId, 1));
    }
  }

  public checkout() {
    const order = new Order(this.orderItems);
    this.orderService.saveOrder(order).subscribe((response) => {
      if (response.body) {
        console.log(response.body);
        this.message =
          'Created Order: Order-Nr.: ' +
          response.body.orderId +
          ' - Date: ' +
          response.body.dateCreated.getFullYear() +
          '-' +
          (response.body.dateCreated.getMonth() + 1) +
          '-' +
          response.body.dateCreated.getDate();
        setTimeout(() => (this.message = undefined), 5000);
      }
    });
    this.orderItems = [];
  }

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe((response) => {
      if (response.body) {
        this.products = response.body;
      }
    });
  }

  constructor(
    private productService: ProductService,
    private orderService: OrderService
  ) {}
}

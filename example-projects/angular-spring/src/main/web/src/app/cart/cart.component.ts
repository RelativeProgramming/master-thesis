import { Component, Input, OnInit } from '@angular/core';
import { OrderItem } from 'src/model/order-item.model';
import { Product } from 'src/model/product.model';

@Component({
  selector: 'cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent implements OnInit {
  @Input() public orderItems?: OrderItem[];
  @Input() products: Product[] = [];

  constructor() {}

  ngOnInit(): void {}

  getProductName(productId: number): string {
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      return product.name;
    }
    return '';
  }
}

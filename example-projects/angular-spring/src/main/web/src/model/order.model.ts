import { OrderItem } from './order-item.model';

export class Order {
  constructor(public orderItems: OrderItem[]) {}
}

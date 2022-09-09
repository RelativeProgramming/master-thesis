import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Product } from "../../model/product.model";

@Component({
  selector: 'product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent {

  @Input() products: Product[] = [];

  @Output() addToCart = new EventEmitter<number>();

  public productClick(productId: number) {
    this.addToCart.emit(productId);
  }
}

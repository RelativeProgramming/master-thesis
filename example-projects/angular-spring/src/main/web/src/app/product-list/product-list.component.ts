import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Product } from "src/model/product.model";
import { ProductService } from "src/service/product.service";

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

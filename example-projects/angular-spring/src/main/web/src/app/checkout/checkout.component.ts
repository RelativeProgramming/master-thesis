import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {

  @Output() checkout = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {}

  public checkoutClick() {
    this.checkout.emit();
  }
}

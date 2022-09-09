package com.example.demo.controller;

import com.example.demo.dto.OrderDTO;
import com.example.demo.model.Order;
import com.example.demo.model.Product;
import com.example.demo.service.OrderService;
import com.example.demo.service.ProductService;
import com.example.demo.vm.OrderConfirmationVM;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/order")
    public ResponseEntity<OrderConfirmationVM> saveOrder(@RequestBody OrderDTO orderDto) {
        Order order = orderService.save(orderDto);
        OrderConfirmationVM confirmationVM = new OrderConfirmationVM();
        confirmationVM.setOrderId(order.getId());
        confirmationVM.setDateCreated(order.getDateCreated());
        return new ResponseEntity<>(confirmationVM, HttpStatus.CREATED);
    }
}

package com.example.demo.service;

import com.example.demo.dto.OrderDTO;
import com.example.demo.model.Order;
import com.example.demo.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional
public class OrderService {

    private final OrderItemService orderItemService;
    private final OrderRepository orderRepository;

    public OrderService(OrderItemService orderItemService, OrderRepository orderRepository) {
        this.orderItemService = orderItemService;
        this.orderRepository = orderRepository;
    }

    public Order save(OrderDTO orderDTO) {
        Order order = new Order();
        order.setOrderItems(orderItemService.saveAll(orderDTO.getItems()));
        order.setDateCreated(LocalDate.now());
        return orderRepository.save(order);
    }
}

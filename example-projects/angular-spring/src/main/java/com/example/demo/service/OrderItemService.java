package com.example.demo.service;

import com.example.demo.dto.OrderItemDTO;
import com.example.demo.model.OrderItem;
import com.example.demo.repository.OrderItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class OrderItemService {

    private final ProductService productService;
    private final OrderItemRepository orderItemRepository;

    public OrderItemService(ProductService productService, OrderItemRepository orderItemRepository) {
        this.productService = productService;
        this.orderItemRepository = orderItemRepository;
    }

    public List<OrderItem> saveAll(List<OrderItemDTO> items) {
        List<OrderItem> result = new ArrayList<>();
        items.forEach((i) -> {
            var product = productService.findById(i.getProductId());
            if(product.isPresent()) {
                OrderItem item = new OrderItem();
                item.setProduct(product.get());
                item.setQuantity(i.getQuantity());
                result.add(orderItemRepository.save(item));
            }
        });
        return result;
    }
}

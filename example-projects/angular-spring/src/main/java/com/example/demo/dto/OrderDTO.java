package com.example.demo.dto;

import java.util.ArrayList;
import java.util.List;

public class OrderDTO {
    private List<OrderItemDTO> items = new ArrayList<>();

    public OrderDTO(List<OrderItemDTO> items) {
        this.items = items;
    }

    public OrderDTO() {}

    public List<OrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDTO> items) {
        this.items = items;
    }
}

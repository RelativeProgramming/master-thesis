package com.example.demo.dto;

public class OrderItemDTO {

    private Long productId;

    private Long quantity;

    public OrderItemDTO(Long productId, Long quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }

    public OrderItemDTO() {}

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Long getQuantity() {
        return quantity;
    }

    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }
}

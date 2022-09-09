package com.example.demo.vm;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public class OrderConfirmationVM {

    private Long orderId;

    @JsonFormat(pattern="yyyy-MM-dd")
    private LocalDate dateCreated;

    public OrderConfirmationVM(Long orderId, LocalDate dateCreated) {
        this.orderId = orderId;
        this.dateCreated = dateCreated;
    }

    public OrderConfirmationVM() {}

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public LocalDate getDateCreated() {
        return dateCreated;
    }

    public void setDateCreated(LocalDate dateCreated) {
        this.dateCreated = dateCreated;
    }
}

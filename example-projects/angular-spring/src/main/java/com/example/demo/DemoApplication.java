package com.example.demo;

import com.example.demo.model.Product;
import com.example.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class DemoApplication {

	@Bean
	public CommandLineRunner demoData(ProductRepository productRepository) {
		return args -> {
			productRepository.save(new Product(1L, "Screw A", 0.99));
			productRepository.save(new Product(2L, "Screw B", 0.89));
		};
	}

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}
}

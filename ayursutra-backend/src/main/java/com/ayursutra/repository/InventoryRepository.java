package com.ayursutra.repository;

import com.ayursutra.entity.InventoryItem;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface InventoryRepository extends MongoRepository<InventoryItem, String> {

    List<InventoryItem> findByCategory(String category);

    boolean existsByNameIgnoreCase(String name);

}

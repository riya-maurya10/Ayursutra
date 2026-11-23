package com.ayursutra.service;

import com.ayursutra.entity.InventoryItem;

import java.util.List;

public interface InventoryService {

    List<InventoryItem> getAllItems();

    InventoryItem getItemById(String id);

    InventoryItem createItem(InventoryItem item);

    InventoryItem updateItem(String id, InventoryItem item);

    InventoryItem adjustStock(String id, Double changeAmount, String reason);

    void deleteItem(String id);

}

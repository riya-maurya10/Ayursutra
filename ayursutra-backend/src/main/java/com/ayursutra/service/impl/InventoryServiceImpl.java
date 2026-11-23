package com.ayursutra.service.impl;

import com.ayursutra.constant.NotificationType;
import com.ayursutra.constant.Role;
import com.ayursutra.entity.InventoryItem;
import com.ayursutra.repository.InventoryRepository;
import com.ayursutra.service.InventoryService;
import com.ayursutra.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final NotificationService notificationService;

    @Override
    public List<InventoryItem> getAllItems() {
        return inventoryRepository.findAll();
    }

    @Override
    public InventoryItem getItemById(String id) {
        return inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found with ID: " + id));
    }

    @Override
    public InventoryItem createItem(InventoryItem item) {
        if (item.getCurrentStock() == null) {
            item.setCurrentStock(0.0);
        }
        if (item.getMinimumThreshold() == null) {
            item.setMinimumThreshold(10.0);
        }
        InventoryItem saved = inventoryRepository.save(item);
        checkAndSendStockAlert(saved);
        return saved;
    }

    @Override
    public InventoryItem updateItem(String id, InventoryItem updated) {
        InventoryItem existing = getItemById(id);

        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getCategory() != null) existing.setCategory(updated.getCategory());
        if (updated.getCurrentStock() != null) existing.setCurrentStock(updated.getCurrentStock());
        if (updated.getUnit() != null) existing.setUnit(updated.getUnit());
        if (updated.getMinimumThreshold() != null) existing.setMinimumThreshold(updated.getMinimumThreshold());
        if (updated.getPricePerUnit() != null) existing.setPricePerUnit(updated.getPricePerUnit());
        if (updated.getBatchNumber() != null) existing.setBatchNumber(updated.getBatchNumber());
        if (updated.getExpiryDate() != null) existing.setExpiryDate(updated.getExpiryDate());
        if (updated.getSupplier() != null) existing.setSupplier(updated.getSupplier());
        if (updated.getStorageLocation() != null) existing.setStorageLocation(updated.getStorageLocation());

        InventoryItem saved = inventoryRepository.save(existing);
        checkAndSendStockAlert(saved);
        return saved;
    }

    @Override
    public InventoryItem adjustStock(String id, Double changeAmount, String reason) {
        InventoryItem existing = getItemById(id);
        double current = existing.getCurrentStock() != null ? existing.getCurrentStock() : 0.0;
        double newStock = current + changeAmount;
        if (newStock < 0) {
            newStock = 0;
        }
        existing.setCurrentStock(newStock);
        InventoryItem saved = inventoryRepository.save(existing);
        checkAndSendStockAlert(saved);
        return saved;
    }

    private void checkAndSendStockAlert(InventoryItem item) {
        if (item != null && item.getCurrentStock() != null && item.getMinimumThreshold() != null
                && item.getCurrentStock() <= item.getMinimumThreshold()) {
            notificationService.sendNotificationToRole(
                    Role.ADMIN,
                    "Low Stock Alert: " + item.getName(),
                    "Stock for " + item.getName() + " is running low (" + item.getCurrentStock() + " " + (item.getUnit() != null ? item.getUnit() : "") + " remaining).",
                    NotificationType.INVENTORY_ALERT,
                    "/admin/inventory"
            );
        }
    }

    @Override
    public void deleteItem(String id) {
        inventoryRepository.deleteById(id);
    }
}

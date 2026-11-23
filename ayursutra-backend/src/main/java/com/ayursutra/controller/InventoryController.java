package com.ayursutra.controller;

import com.ayursutra.entity.InventoryItem;
import com.ayursutra.service.InventoryService;
import com.ayursutra.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','THERAPIST','RECEPTIONIST')")
    public ApiResponse<List<InventoryItem>> getAllItems() {
        return ApiResponse.success("Inventory items retrieved", inventoryService.getAllItems());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','THERAPIST','RECEPTIONIST')")
    public ApiResponse<InventoryItem> getItemById(@PathVariable String id) {
        return ApiResponse.success("Inventory item retrieved", inventoryService.getItemById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ApiResponse<InventoryItem> createItem(@RequestBody InventoryItem item) {
        return ApiResponse.success("Inventory item added successfully", inventoryService.createItem(item));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ApiResponse<InventoryItem> updateItem(
            @PathVariable String id,
            @RequestBody InventoryItem item) {
        return ApiResponse.success("Inventory item updated successfully", inventoryService.updateItem(id, item));
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','THERAPIST','RECEPTIONIST')")
    public ApiResponse<InventoryItem> adjustStock(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload) {
        Double changeAmount = Double.valueOf(payload.getOrDefault("changeAmount", 0).toString());
        String reason = payload.getOrDefault("reason", "Manual adjustment").toString();
        return ApiResponse.success("Stock adjusted successfully", inventoryService.adjustStock(id, changeAmount, reason));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> deleteItem(@PathVariable String id) {
        inventoryService.deleteItem(id);
        return ApiResponse.success("Inventory item deleted successfully", id);
    }
}

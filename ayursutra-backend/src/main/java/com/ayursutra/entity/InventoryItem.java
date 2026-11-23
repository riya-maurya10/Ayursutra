package com.ayursutra.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Document(collection = "inventory_items")
public class InventoryItem extends BaseEntity {

    private String name;

    private String category; // e.g. MEDICATED_OIL, HERBAL_POWDER, KWATHA, GHEE, CONSUMABLE, LINEN

    private Double currentStock;

    private String unit; // e.g. ml, gm, kg, litre, bottles, pieces

    private Double minimumThreshold;

    private Double pricePerUnit;

    private String batchNumber;

    private String expiryDate;

    private String supplier;

    private String storageLocation; // e.g. Pharmacy Rack A, Room 102 Cabinet

}

package com.ayursutra.service;

import com.ayursutra.entity.BillingRecord;

import java.util.List;

public interface BillingService {

    List<BillingRecord> getAllBills();

    List<BillingRecord> getBillsByPatientId(String patientId);

    BillingRecord getBillById(String id);

    BillingRecord createBill(BillingRecord bill);

    BillingRecord recordPayment(String id, Double paymentAmount, String paymentMethod, String transactionRef);

}

package com.ayursutra.repository;

import com.ayursutra.entity.BillingRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface BillingRepository extends MongoRepository<BillingRecord, String> {

    List<BillingRecord> findByPatientId(String patientId);

    Optional<BillingRecord> findByInvoiceNumber(String invoiceNumber);

}

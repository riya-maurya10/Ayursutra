package com.ayursutra.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface DocumentStorageService {

    String storeDocument(MultipartFile file);

    Resource loadDocumentAsResource(String fileName);

}

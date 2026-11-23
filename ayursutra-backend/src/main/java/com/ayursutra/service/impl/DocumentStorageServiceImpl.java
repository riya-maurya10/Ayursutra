package com.ayursutra.service.impl;

import com.ayursutra.service.DocumentStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class DocumentStorageServiceImpl implements DocumentStorageService {

    private final Path fileStorageLocation;

    public DocumentStorageServiceImpl() {
        this.fileStorageLocation = Paths.get("uploads/staff-documents").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where uploaded documents will be stored.", ex);
        }
    }

    @Override
    public String storeDocument(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Cannot store an empty file.");
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf");
        String extension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFileName.substring(dotIndex);
        }

        String secureFileName = UUID.randomUUID().toString() + extension;

        try {
            if (secureFileName.contains("..")) {
                throw new RuntimeException("Filename contains invalid path sequence: " + secureFileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(secureFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return "http://localhost:9999/api/documents/download/" + secureFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + secureFileName + ". Please try again!", ex);
        }
    }

    @Override
    public Resource loadDocumentAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("File not found: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found: " + fileName, ex);
        }
    }
}

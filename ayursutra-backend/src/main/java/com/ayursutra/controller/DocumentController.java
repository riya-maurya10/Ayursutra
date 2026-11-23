package com.ayursutra.controller;

import com.ayursutra.service.DocumentStorageService;
import com.ayursutra.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentStorageService documentStorageService;

    @PostMapping("/upload")
    public ApiResponse<Map<String, String>> uploadDocument(
            @RequestParam("file") MultipartFile file) {

        String fileDownloadUri = documentStorageService.storeDocument(file);

        return ApiResponse.success(
                "Document uploaded successfully",
                Map.of(
                        "documentUrl", fileDownloadUri,
                        "fileName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "document",
                        "size", String.valueOf(file.getSize())
                )
        );
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable String fileName) {
        Resource resource = documentStorageService.loadDocumentAsResource(fileName);

        String contentType = "application/octet-stream";
        try {
            contentType = Files.probeContentType(resource.getFile().toPath());
        } catch (IOException ex) {
            // default to octet-stream
        }
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}

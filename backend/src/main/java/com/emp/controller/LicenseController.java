package com.emp.controller;

import com.emp.dto.*;
import com.emp.service.LicenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/licenses")
@RequiredArgsConstructor
public class LicenseController {

    private final LicenseService licenseService;

    @GetMapping
    public ResponseEntity<List<LicenseResponse>> getAllLicenses() {
        return ResponseEntity.ok(licenseService.getAllLicenses());
    }

    @PostMapping("/generate")
    public ResponseEntity<LicenseResponse> generateLicense(
            @Valid @RequestBody LicenseRequest request) {
        return ResponseEntity.ok(licenseService.generateLicense(request));
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<LicenseResponse> revokeLicense(@PathVariable Long id) {
        return ResponseEntity.ok(licenseService.revokeLicense(id));
    }

    @GetMapping("/keys/public")
    public ResponseEntity<Map<String, String>> getPublicKey() {
        String publicKeyPEM = licenseService.getOrCreateActiveKeys().getPublicKeyPEM();
        return ResponseEntity.ok(Map.of("publicKey", publicKeyPEM));
    }

    @PostMapping("/keys/regenerate")
    public ResponseEntity<Map<String, String>> regenerateKeys() {
        String newPublicKeyPEM = licenseService.regenerateKeys().getPublicKeyPEM();
        return ResponseEntity.ok(Map.of(
                "message", "RSA Key pair regenerated successfully. Previously generated licenses will now fail verification.",
                "publicKey", newPublicKeyPEM
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<LicenseVerifyResponse> verifyLicense(
            @Valid @RequestBody LicenseVerifyRequest request) {
        return ResponseEntity.ok(licenseService.verifyLicense(request.getLicenseKey()));
    }
}

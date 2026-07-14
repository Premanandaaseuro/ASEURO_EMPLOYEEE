package com.emp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.emp.dto.*;
import com.emp.model.KeyPairConfig;
import com.emp.model.LicenseKey;
import com.emp.repository.KeyPairConfigRepository;
import com.emp.repository.LicenseKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LicenseService {

    private final LicenseKeyRepository licenseKeyRepository;
    private final KeyPairConfigRepository keyPairConfigRepository;
    private final LicenseCryptoService licenseCryptoService;
    private final ObjectMapper objectMapper;

    /**
     * Gets the latest active key pair, or generates a new one if none exists.
     */
    public KeyPairConfig getOrCreateActiveKeys() {
        return keyPairConfigRepository.findFirstByOrderByIdDesc()
                .orElseGet(this::regenerateKeys);
    }

    /**
     * Regenerates the system RSA keys.
     * WARNING: This invalidates all previously issued licenses.
     */
    public KeyPairConfig regenerateKeys() {
        log.info("Regenerating system RSA key pair...");
        KeyPair pair = licenseCryptoService.generateKeyPair();
        String pubPEM = licenseCryptoService.publicKeyToPem(pair.getPublic());
        String privPEM = licenseCryptoService.privateKeyToPem(pair.getPrivate());

        KeyPairConfig config = KeyPairConfig.builder()
                .publicKeyPEM(pubPEM)
                .privateKeyPEM(privPEM)
                .build();

        KeyPairConfig saved = keyPairConfigRepository.save(config);
        log.info("Successfully saved new key pair with ID: {}", saved.getId());
        return saved;
    }

    /**
     * Generates a signed cryptographic license and saves it to the database.
     */
    public LicenseResponse generateLicense(LicenseRequest request) {
        log.info("Generating license for customer: {} - Product: {}", request.getCustomerName(), request.getProductName());

        KeyPairConfig keys = getOrCreateActiveKeys();
        PrivateKey privateKey = licenseCryptoService.pemToPrivateKey(keys.getPrivateKeyPEM());

        try {
            // 1. Prepare JSON payload
            LicensePayload payload = LicensePayload.builder()
                    .customerName(request.getCustomerName())
                    .customerEmail(request.getCustomerEmail())
                    .productName(request.getProductName())
                    .expiryDate(request.getExpiryDate().toString())
                    .features(request.getFeatures() != null ? request.getFeatures() : Collections.emptyList())
                    .maxSeats(request.getMaxSeats())
                    .build();

            String payloadJson = objectMapper.writeValueAsString(payload);

            // 2. Base64 encode the payload
            String base64Payload = Base64.getEncoder().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

            // 3. Cryptographically sign the payload
            String base64Signature = licenseCryptoService.sign(base64Payload, privateKey);

            // 4. Combine into final license key format
            String licenseKeyString = base64Payload + "." + base64Signature;

            // 5. Store in DB
            String featuresStr = request.getFeatures() != null 
                    ? String.join(",", request.getFeatures()) 
                    : "";

            LicenseKey licenseKey = LicenseKey.builder()
                    .licenseKey(licenseKeyString)
                    .customerName(request.getCustomerName())
                    .customerEmail(request.getCustomerEmail())
                    .productName(request.getProductName())
                    .expiryDate(request.getExpiryDate())
                    .features(featuresStr)
                    .maxSeats(request.getMaxSeats())
                    .status(LicenseKey.LicenseStatus.ACTIVE)
                    .build();

            LicenseKey saved = licenseKeyRepository.save(licenseKey);
            return mapToResponse(saved);

        } catch (Exception e) {
            log.error("Failed to generate license key", e);
            throw new RuntimeException("License generation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Lists all generated licenses ordered by newest first.
     */
    @Transactional(readOnly = true)
    public List<LicenseResponse> getAllLicenses() {
        return licenseKeyRepository.findAllByOrderByIdDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Revokes a license key by its ID.
     */
    public LicenseResponse revokeLicense(Long id) {
        log.info("Revoking license with ID: {}", id);
        LicenseKey license = licenseKeyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("License not found with ID: " + id));

        license.setStatus(LicenseKey.LicenseStatus.REVOKED);
        license.setRevokedAt(LocalDateTime.now());
        return mapToResponse(licenseKeyRepository.save(license));
    }

    /**
     * Verifies a license key string.
     * Decodes the signature, verifies it using the public key, and validates conditions.
     */
    @Transactional(readOnly = true)
    public LicenseVerifyResponse verifyLicense(String licenseKeyString) {
        if (licenseKeyString == null || !licenseKeyString.contains(".")) {
            return LicenseVerifyResponse.builder()
                    .valid(false)
                    .status("INVALID_SIGNATURE")
                    .message("Invalid license format (must contain payload and signature separated by dot)")
                    .build();
        }

        String[] parts = licenseKeyString.trim().split("\\.");
        if (parts.length != 2) {
            return LicenseVerifyResponse.builder()
                    .valid(false)
                    .status("INVALID_SIGNATURE")
                    .message("Invalid license format (incorrect segment count)")
                    .build();
        }

        String base64Payload = parts[0];
        String base64Signature = parts[1];

        // 1. Verify cryptography
        KeyPairConfig keys = getOrCreateActiveKeys();
        PublicKey publicKey = licenseCryptoService.pemToPublicKey(keys.getPublicKeyPEM());

        boolean sigValid = licenseCryptoService.verify(base64Payload, base64Signature, publicKey);
        if (!sigValid) {
            return LicenseVerifyResponse.builder()
                    .valid(false)
                    .status("INVALID_SIGNATURE")
                    .message("Cryptographic signature verification failed (license may have been tampered with or signed by a different key)")
                    .build();
        }

        // 2. Decode & Parse Payload
        try {
            String decodedPayloadJson = new String(Base64.getDecoder().decode(base64Payload), StandardCharsets.UTF_8);
            LicensePayload payload = objectMapper.readValue(decodedPayloadJson, LicensePayload.class);

            LicenseVerifyResponse.LicenseMetadata metadata = LicenseVerifyResponse.LicenseMetadata.builder()
                    .customerName(payload.getCustomerName())
                    .customerEmail(payload.getCustomerEmail())
                    .productName(payload.getProductName())
                    .expiryDate(LocalDate.parse(payload.getExpiryDate()))
                    .features(payload.getFeatures())
                    .maxSeats(payload.getMaxSeats())
                    .build();

            // 3. Check Expiry
            if (metadata.getExpiryDate().isBefore(LocalDate.now())) {
                return LicenseVerifyResponse.builder()
                        .valid(false)
                        .status("EXPIRED")
                        .message("The license expired on " + metadata.getExpiryDate())
                        .metadata(metadata)
                        .build();
            }

            // 4. Check DB Revocation Status
            Optional<LicenseKey> dbLicenseOpt = licenseKeyRepository.findByLicenseKey(licenseKeyString.trim());
            if (dbLicenseOpt.isPresent() && dbLicenseOpt.get().getStatus() == LicenseKey.LicenseStatus.REVOKED) {
                return LicenseVerifyResponse.builder()
                        .valid(false)
                        .status("REVOKED")
                        .message("This license has been explicitly revoked by the administrator")
                        .metadata(metadata)
                        .build();
            }

            // Otherwise, it is valid!
            return LicenseVerifyResponse.builder()
                    .valid(true)
                    .status("VALID")
                    .message("License is cryptographically valid and active")
                    .metadata(metadata)
                    .build();

        } catch (Exception e) {
            return LicenseVerifyResponse.builder()
                    .valid(false)
                    .status("INVALID_SIGNATURE")
                    .message("Failed to parse license metadata payload: " + e.getMessage())
                    .build();
        }
    }

    private LicenseResponse mapToResponse(LicenseKey license) {
        List<String> featuresList = license.getFeatures() == null || license.getFeatures().isEmpty()
                ? Collections.emptyList()
                : Arrays.asList(license.getFeatures().split(","));

        return LicenseResponse.builder()
                .id(license.getId())
                .licenseKey(license.getLicenseKey())
                .customerName(license.getCustomerName())
                .customerEmail(license.getCustomerEmail())
                .productName(license.getProductName())
                .expiryDate(license.getExpiryDate())
                .features(featuresList)
                .maxSeats(license.getMaxSeats())
                .status(license.getStatus().name())
                .createdAt(license.getCreatedAt())
                .revokedAt(license.getRevokedAt())
                .build();
    }

    /**
     * DTO matching the JSON structure serialized in the key
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    @lombok.Builder
    private static class LicensePayload {
        private String customerName;
        private String customerEmail;
        private String productName;
        private String expiryDate;
        private List<String> features;
        private Integer maxSeats;
    }
}

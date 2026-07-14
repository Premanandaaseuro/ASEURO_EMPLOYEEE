package com.emp.service;

import com.emp.dto.LicenseRequest;
import com.emp.dto.LicenseResponse;
import com.emp.dto.LicenseVerifyResponse;
import com.emp.model.KeyPairConfig;
import com.emp.repository.KeyPairConfigRepository;
import com.emp.repository.LicenseKeyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class LicenseServiceTest {

    @Autowired
    private LicenseService licenseService;

    @Autowired
    private LicenseKeyRepository licenseKeyRepository;

    @Autowired
    private KeyPairConfigRepository keyPairConfigRepository;

    @Test
    public void testFullLicenseLifecycle() {
        // 1. Check Key generation
        KeyPairConfig initialKeys = licenseService.getOrCreateActiveKeys();
        assertNotNull(initialKeys);
        assertNotNull(initialKeys.getPublicKeyPEM());
        assertNotNull(initialKeys.getPrivateKeyPEM());

        // 2. Generate a license
        LicenseRequest request = LicenseRequest.builder()
                .customerName("Acme Services")
                .customerEmail("billing@acme.org")
                .productName("Enterprise Suite")
                .expiryDate(LocalDate.now().plusYears(1))
                .maxSeats(10)
                .features(List.of("analytics", "sso"))
                .build();

        LicenseResponse response = licenseService.generateLicense(request);
        assertNotNull(response);
        assertNotNull(response.getId());
        assertNotNull(response.getLicenseKey());
        assertEquals("Acme Services", response.getCustomerName());
        assertEquals("ACTIVE", response.getStatus());

        // 3. Verify the generated license key
        LicenseVerifyResponse verifyResponse = licenseService.verifyLicense(response.getLicenseKey());
        assertTrue(verifyResponse.isValid());
        assertEquals("VALID", verifyResponse.getStatus());
        assertNotNull(verifyResponse.getMetadata());
        assertEquals("Acme Services", verifyResponse.getMetadata().getCustomerName());
        assertEquals("billing@acme.org", verifyResponse.getMetadata().getCustomerEmail());
        assertEquals("Enterprise Suite", verifyResponse.getMetadata().getProductName());
        assertEquals(10, verifyResponse.getMetadata().getMaxSeats());
        assertTrue(verifyResponse.getMetadata().getFeatures().contains("analytics"));
        assertTrue(verifyResponse.getMetadata().getFeatures().contains("sso"));

        // 4. Revoke the license
        LicenseResponse revokedResponse = licenseService.revokeLicense(response.getId());
        assertEquals("REVOKED", revokedResponse.getStatus());
        assertNotNull(revokedResponse.getRevokedAt());

        // 5. Verify the license key again (expect REVOKED)
        LicenseVerifyResponse verifyRevokedResponse = licenseService.verifyLicense(response.getLicenseKey());
        assertFalse(verifyRevokedResponse.isValid());
        assertEquals("REVOKED", verifyRevokedResponse.getStatus());

        // 6. Generate another license for a new customer
        LicenseRequest request2 = LicenseRequest.builder()
                .customerName("Beta Labs")
                .customerEmail("contact@beta.io")
                .productName("Standard Cloud")
                .expiryDate(LocalDate.now().plusYears(2))
                .maxSeats(5)
                .features(List.of("billing"))
                .build();
        LicenseResponse response2 = licenseService.generateLicense(request2);
        assertTrue(licenseService.verifyLicense(response2.getLicenseKey()).isValid());

        // 7. Regenerate keys
        KeyPairConfig newKeys = licenseService.regenerateKeys();
        assertNotEquals(initialKeys.getPublicKeyPEM(), newKeys.getPublicKeyPEM());

        // 8. Verify the second license key now (expect INVALID_SIGNATURE because keys changed)
        LicenseVerifyResponse verifyInvalidSigResponse = licenseService.verifyLicense(response2.getLicenseKey());
        assertFalse(verifyInvalidSigResponse.isValid());
        assertEquals("INVALID_SIGNATURE", verifyInvalidSigResponse.getStatus());
    }
}

package com.emp.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LicenseVerifyResponse {
    private boolean valid;
    private String status; // VALID, EXPIRED, REVOKED, INVALID_SIGNATURE
    private String message;
    private LicenseMetadata metadata;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LicenseMetadata {
        private String customerName;
        private String customerEmail;
        private String productName;
        private LocalDate expiryDate;
        private List<String> features;
        private Integer maxSeats;
    }
}

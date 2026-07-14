package com.emp.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LicenseResponse {
    private Long id;
    private String licenseKey;
    private String customerName;
    private String customerEmail;
    private String productName;
    private LocalDate expiryDate;
    private List<String> features;
    private Integer maxSeats;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime revokedAt;
}

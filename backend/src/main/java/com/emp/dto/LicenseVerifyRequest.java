package com.emp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LicenseVerifyRequest {

    @NotBlank(message = "License key is required")
    private String licenseKey;
}

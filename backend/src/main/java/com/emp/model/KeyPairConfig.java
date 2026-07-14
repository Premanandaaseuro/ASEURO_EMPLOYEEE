package com.emp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "key_pair_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeyPairConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_key_pem", nullable = false, length = 2000)
    private String publicKeyPEM;

    @Column(name = "private_key_pem", nullable = false, length = 3000)
    private String privateKeyPEM;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

package com.emp.repository;

import com.emp.model.KeyPairConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KeyPairConfigRepository extends JpaRepository<KeyPairConfig, Long> {
    Optional<KeyPairConfig> findFirstByOrderByIdDesc();
}

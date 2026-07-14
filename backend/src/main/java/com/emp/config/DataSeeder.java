package com.emp.config;

import com.emp.model.Employee;
import com.emp.model.User;
import com.emp.repository.EmployeeRepository;
import com.emp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Seeds initial data when profile is 'dev' or 'docker'.
 * Run with: -Dspring.profiles.active=dev
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
@Profile({"dev", "docker"})
public class DataSeeder {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedData() {
        return args -> {
            // Seed admin user
            if (!userRepository.existsByUsername("admin")) {
                userRepository.save(User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin123"))
                        .email("admin@emp.com")
                        .role(User.Role.ADMIN)
                        .build());
                log.info("Seeded admin user (username: admin, password: admin123)");
            }

            // Seed sample employees
            if (employeeRepository.count() == 0) {
                employeeRepository.save(Employee.builder()
                        .firstName("Alice").lastName("Johnson").email("alice@emp.com")
                        .department("Engineering").position("Senior Software Engineer")
                        .salary(new BigDecimal("95000.00")).joiningDate(LocalDate.of(2021, 3, 15))
                        .phone("+1-555-0101").status(Employee.EmployeeStatus.ACTIVE).build());

                employeeRepository.save(Employee.builder()
                        .firstName("Bob").lastName("Smith").email("bob@emp.com")
                        .department("Marketing").position("Marketing Manager")
                        .salary(new BigDecimal("78000.00")).joiningDate(LocalDate.of(2020, 7, 1))
                        .phone("+1-555-0102").status(Employee.EmployeeStatus.ACTIVE).build());

                employeeRepository.save(Employee.builder()
                        .firstName("Carol").lastName("Williams").email("carol@emp.com")
                        .department("Engineering").position("DevOps Engineer")
                        .salary(new BigDecimal("88000.00")).joiningDate(LocalDate.of(2022, 1, 10))
                        .phone("+1-555-0103").status(Employee.EmployeeStatus.ACTIVE).build());

                employeeRepository.save(Employee.builder()
                        .firstName("David").lastName("Brown").email("david@emp.com")
                        .department("HR").position("HR Specialist")
                        .salary(new BigDecimal("62000.00")).joiningDate(LocalDate.of(2019, 11, 20))
                        .phone("+1-555-0104").status(Employee.EmployeeStatus.ON_LEAVE).build());

                employeeRepository.save(Employee.builder()
                        .firstName("Emma").lastName("Davis").email("emma@emp.com")
                        .department("Finance").position("Financial Analyst")
                        .salary(new BigDecimal("72000.00")).joiningDate(LocalDate.now().minusDays(5))
                        .phone("+1-555-0105").status(Employee.EmployeeStatus.ACTIVE).build());

                employeeRepository.save(Employee.builder()
                        .firstName("Frank").lastName("Miller").email("frank@emp.com")
                        .department("Engineering").position("QA Engineer")
                        .salary(new BigDecimal("70000.00")).joiningDate(LocalDate.of(2023, 5, 1))
                        .phone("+1-555-0106").status(Employee.EmployeeStatus.ACTIVE).build());

                log.info("Seeded 6 sample employees");
            }
        };
    }
}

package com.emp.dto;

import com.emp.model.Employee;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class EmployeeDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotBlank(message = "First name is required")
        @Size(max = 50)
        private String firstName;

        @NotBlank(message = "Last name is required")
        @Size(max = 50)
        private String lastName;

        @NotBlank(message = "Email is required")
        @Email
        private String email;

        @NotBlank(message = "Department is required")
        private String department;

        @NotBlank(message = "Position is required")
        private String position;

        @NotNull(message = "Salary is required")
        @DecimalMin(value = "0.0", inclusive = false)
        private BigDecimal salary;

        @NotNull(message = "Joining date is required")
        private LocalDate joiningDate;

        @NotBlank(message = "Phone is required")
        private String phone;

        private Employee.EmployeeStatus status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String department;
        private String position;
        private BigDecimal salary;
        private LocalDate joiningDate;
        private String phone;
        private Employee.EmployeeStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response fromEmployee(Employee e) {
            return Response.builder()
                    .id(e.getId())
                    .firstName(e.getFirstName())
                    .lastName(e.getLastName())
                    .email(e.getEmail())
                    .department(e.getDepartment())
                    .position(e.getPosition())
                    .salary(e.getSalary())
                    .joiningDate(e.getJoiningDate())
                    .phone(e.getPhone())
                    .status(e.getStatus())
                    .createdAt(e.getCreatedAt())
                    .updatedAt(e.getUpdatedAt())
                    .build();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Stats {
        private long totalEmployees;
        private long activeEmployees;
        private long inactiveEmployees;
        private long onLeaveEmployees;
        private long departments;
        private BigDecimal averageSalary;
        private long newThisMonth;
    }
}

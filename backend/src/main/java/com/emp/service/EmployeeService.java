package com.emp.service;

import com.emp.dto.EmployeeDTO;
import com.emp.model.Employee;
import com.emp.repository.EmployeeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public Page<EmployeeDTO.Response> getAllEmployees(Pageable pageable) {
        return employeeRepository.findAll(pageable).map(EmployeeDTO.Response::fromEmployee);
    }

    public EmployeeDTO.Response getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .map(EmployeeDTO.Response::fromEmployee)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + id));
    }

    public EmployeeDTO.Response createEmployee(EmployeeDTO.Request request) {
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        Employee employee = Employee.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .department(request.getDepartment())
                .position(request.getPosition())
                .salary(request.getSalary())
                .joiningDate(request.getJoiningDate())
                .phone(request.getPhone())
                .status(request.getStatus() != null ? request.getStatus() : Employee.EmployeeStatus.ACTIVE)
                .build();

        Employee saved = employeeRepository.save(employee);
        log.info("Created employee: {} {}", saved.getFirstName(), saved.getLastName());
        return EmployeeDTO.Response.fromEmployee(saved);
    }

    public EmployeeDTO.Response updateEmployee(Long id, EmployeeDTO.Request request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + id));

        // If email changed, check uniqueness
        if (!employee.getEmail().equals(request.getEmail()) &&
                employeeRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setDepartment(request.getDepartment());
        employee.setPosition(request.getPosition());
        employee.setSalary(request.getSalary());
        employee.setJoiningDate(request.getJoiningDate());
        employee.setPhone(request.getPhone());
        if (request.getStatus() != null) {
            employee.setStatus(request.getStatus());
        }

        Employee updated = employeeRepository.save(employee);
        log.info("Updated employee id: {}", id);
        return EmployeeDTO.Response.fromEmployee(updated);
    }

    public void deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new EntityNotFoundException("Employee not found with id: " + id);
        }
        employeeRepository.deleteById(id);
        log.info("Deleted employee id: {}", id);
    }

    public Page<EmployeeDTO.Response> searchEmployees(String keyword, Pageable pageable) {
        return employeeRepository.searchEmployees(keyword, pageable)
                .map(EmployeeDTO.Response::fromEmployee);
    }

    public Page<EmployeeDTO.Response> getByDepartment(String department, Pageable pageable) {
        return employeeRepository.findByDepartment(department, pageable)
                .map(EmployeeDTO.Response::fromEmployee);
    }

    public List<String> getAllDepartments() {
        return employeeRepository.findAllDepartments();
    }

    @Transactional(readOnly = true)
    public EmployeeDTO.Stats getStats() {
        long total = employeeRepository.count();
        long active = employeeRepository.countByStatus(Employee.EmployeeStatus.ACTIVE);
        long inactive = employeeRepository.countByStatus(Employee.EmployeeStatus.INACTIVE);
        long onLeave = employeeRepository.countByStatus(Employee.EmployeeStatus.ON_LEAVE);
        long deptCount = employeeRepository.findAllDepartments().size();

        BigDecimal avgSalary = employeeRepository.findAll().stream()
                .map(Employee::getSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(total > 0 ? BigDecimal.valueOf(total) : BigDecimal.ONE, 2, java.math.RoundingMode.HALF_UP);

        long newThisMonth = employeeRepository.findAll().stream()
                .filter(e -> e.getJoiningDate() != null &&
                             e.getJoiningDate().getYear() == LocalDate.now().getYear() &&
                             e.getJoiningDate().getMonth() == LocalDate.now().getMonth())
                .count();

        return EmployeeDTO.Stats.builder()
                .totalEmployees(total)
                .activeEmployees(active)
                .inactiveEmployees(inactive)
                .onLeaveEmployees(onLeave)
                .departments(deptCount)
                .averageSalary(avgSalary)
                .newThisMonth(newThisMonth)
                .build();
    }
}

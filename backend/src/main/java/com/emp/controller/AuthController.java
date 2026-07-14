package com.emp.controller;

import com.emp.dto.AuthDTO;
import com.emp.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthDTO.LoginResponse> login(
            @Valid @RequestBody AuthDTO.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDTO.LoginResponse> register(
            @Valid @RequestBody AuthDTO.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/register-face")
    public ResponseEntity<Map<String, String>> registerFace(
            @Valid @RequestBody AuthDTO.RegisterFaceRequest request,
            java.security.Principal principal) {
        authService.registerFace(principal.getName(), request.getCapturedPhoto());
        return ResponseEntity.ok(Map.of("message", "Face profile registered successfully"));
    }

    @PostMapping("/face-login")
    public ResponseEntity<AuthDTO.LoginResponse> faceLogin(
            @Valid @RequestBody AuthDTO.FaceLoginRequest request) {
        return ResponseEntity.ok(authService.faceLogin(request));
    }
}

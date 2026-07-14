package com.emp.service;

import com.emp.dto.AuthDTO;
import com.emp.model.User;
import com.emp.repository.UserRepository;
import com.emp.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Base64;
import javax.imageio.ImageIO;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthDTO.LoginResponse login(AuthDTO.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        String token = jwtUtil.generateToken(userDetails, user.getRole().name());

        log.info("User logged in: {}", request.getUsername());

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .message("Login successful")
                .build();
    }

    public AuthDTO.LoginResponse register(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        // First registered user becomes ADMIN
        User.Role role = userRepository.count() == 0 ? User.Role.ADMIN : User.Role.USER;

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .role(role)
                .build();

        userRepository.save(user);
        log.info("Registered new user: {} with role: {}", request.getUsername(), role);

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        String token = jwtUtil.generateToken(userDetails, role.name());

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(role.name())
                .message("Registration successful")
                .build();
    }

    public void registerFace(String username, String capturedPhoto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        user.setFacePhoto(capturedPhoto);
        userRepository.save(user);
        log.info("Registered face photo for user: {}", username);
    }

    public AuthDTO.LoginResponse faceLogin(AuthDTO.FaceLoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Authentication failed: User not found."));

        if (user.getFacePhoto() == null || user.getFacePhoto().isEmpty()) {
            throw new IllegalArgumentException("No face profile registered for user '" + request.getUsername() + "'. Please log in with password first to register your face.");
        }

        log.info("Matching face snapshot with registered profile for user: {}", request.getUsername());
        
        // Compute cropped & normalized image similarity
        double similarityScore = calculateImageSimilarity(user.getFacePhoto(), request.getCapturedPhoto());
        
        // Reject if similarity is below 78.0%
        if (similarityScore < 78.0) {
            throw new IllegalArgumentException(String.format("Biometric match failed: face similarity (%.1f%%) is below the required 78%% security threshold.", similarityScore));
        }

        log.info("Face biometric match successful! Similarity: {}%", String.format("%.2f", similarityScore));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtil.generateToken(userDetails, user.getRole().name());

        log.info("User logged in via Face Login: {}", user.getUsername());

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .message(String.format("Face login successful (Match: %.1f%%)", similarityScore))
                .build();
    }

    private double calculateImageSimilarity(String base64Image1, String base64Image2) {
        try {
            // Set headless AWT flag to prevent headless environment exceptions
            System.setProperty("java.awt.headless", "true");
            
            byte[] bytes1 = Base64.getDecoder().decode(cleanBase64(base64Image1));
            byte[] bytes2 = Base64.getDecoder().decode(cleanBase64(base64Image2));
            
            try (ByteArrayInputStream bais1 = new ByteArrayInputStream(bytes1);
                 ByteArrayInputStream bais2 = new ByteArrayInputStream(bytes2)) {
                
                BufferedImage img1 = ImageIO.read(bais1);
                BufferedImage img2 = ImageIO.read(bais2);
                
                if (img1 == null || img2 == null) {
                    log.warn("Failed to decode images: img1={}, img2={}", img1 != null, img2 != null);
                    return 0.0;
                }
                
                // Crop to the center 60% of the image (focusing on the face, eliminating the background)
                BufferedImage face1 = cropCenter(img1, 0.6);
                BufferedImage face2 = cropCenter(img2, 0.6);
                
                // Downsample both to 32x32 to ignore minor position shifts/noise
                int size = 32;
                BufferedImage resized1 = resize(face1, size, size);
                BufferedImage resized2 = resize(face2, size, size);
                
                // Convert to grayscale & normalize brightness (compensates for lighting differences)
                int[] pixels1 = getNormalizedGrayscale(resized1, size);
                int[] pixels2 = getNormalizedGrayscale(resized2, size);
                
                long diff = 0;
                for (int i = 0; i < size * size; i++) {
                    diff += Math.abs(pixels1[i] - pixels2[i]);
                }
                
                double maxDiff = size * size * 255.0;
                double similarity = (1.0 - (double) diff / maxDiff) * 100.0;
                
                log.info("Face comparison similarity score (cropped/normalized): {}%", String.format("%.2f", similarity));
                return similarity;
            }
        } catch (Exception e) {
            log.error("Failed to compare face images", e);
            return 0.0;
        }
    }

    private BufferedImage cropCenter(BufferedImage src, double percentage) {
        int w = src.getWidth();
        int h = src.getHeight();
        int targetW = (int) (w * percentage);
        int targetH = (int) (h * percentage);
        int x = (w - targetW) / 2;
        int y = (h - targetH) / 2;
        return src.getSubimage(x, y, targetW, targetH);
    }

    private BufferedImage resize(BufferedImage src, int width, int height) {
        BufferedImage resized = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resized.createGraphics();
        g.drawImage(src, 0, 0, width, height, null);
        g.dispose();
        return resized;
    }

    private int[] getNormalizedGrayscale(BufferedImage src, int size) {
        int[] grayscale = new int[size * size];
        long total = 0;
        
        for (int y = 0; y < size; y++) {
            for (int x = 0; x < size; x++) {
                int rgb = src.getRGB(x, y);
                int r = (rgb >> 16) & 0xff;
                int g = (rgb >> 8) & 0xff;
                int b = rgb & 0xff;
                
                // Standard grayscale conversion
                int gray = (int) (0.299 * r + 0.587 * g + 0.114 * b);
                grayscale[y * size + x] = gray;
                total += gray;
            }
        }
        
        // Normalize brightness: adjust so average brightness is 128
        int avg = (int) (total / (size * size));
        int adjustment = 128 - avg;
        
        for (int i = 0; i < size * size; i++) {
            int adjusted = grayscale[i] + adjustment;
            grayscale[i] = Math.max(0, Math.min(255, adjusted));
        }
        
        return grayscale;
    }

    private String cleanBase64(String base64) {
        if (base64 != null && base64.contains(",")) {
            return base64.split(",")[1];
        }
        return base64;
    }
}

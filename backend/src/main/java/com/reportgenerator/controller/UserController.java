package com.reportgenerator.controller;

import com.reportgenerator.model.User;
import com.reportgenerator.repository.UserRepository;
import com.reportgenerator.security.UserDetailsImpl;
import com.reportgenerator.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users/profile")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.reportgenerator.repository.ActivityLogRepository activityLogRepository;

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        // Generate 6-digit OTP
        Random random = new Random();
        String otpCode = String.format("%06d", 100000 + random.nextInt(900000));
        user.setOtpCode(otpCode);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5)); // Valid for 5 minutes
        userRepository.save(user);

        // Send OTP email
        emailService.sendOtpEmail(user.getEmail(), otpCode);

        return ResponseEntity.ok("Verification OTP code sent to your email.");
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> request, Authentication authentication) {
        String newUsername = request.get("username");
        String newPassword = request.get("password");
        String otp = request.get("otp");

        if (otp == null || otp.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: OTP is required.");
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        // Validate OTP
        if (user.getOtpCode() == null || !user.getOtpCode().equals(otp.trim())) {
            return ResponseEntity.badRequest().body("Error: Invalid verification OTP code.");
        }
        if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            return ResponseEntity.badRequest().body("Error: Verification OTP code has expired.");
        }

        boolean updated = false;

        // 1. Process username update if provided
        if (newUsername != null && !newUsername.trim().isEmpty() && !newUsername.trim().equalsIgnoreCase(user.getUsername())) {
            newUsername = newUsername.trim().toLowerCase();
            if (newUsername.length() < 3) {
                return ResponseEntity.badRequest().body("Error: Username must be at least 3 characters.");
            }
            if (userRepository.existsByUsername(newUsername)) {
                return ResponseEntity.badRequest().body("Error: Username is already in use!");
            }
            user.setUsername(newUsername);
            updated = true;
        }

        // 2. Process password update if provided
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest().body("Error: Password must be at least 6 characters.");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
            updated = true;
        }

        if (!updated) {
            return ResponseEntity.badRequest().body("Error: No username or password changes provided.");
        }

        // Clear OTP
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        // Save activity log
        try {
            activityLogRepository.save(new com.reportgenerator.model.ActivityLog(
                "Profile credentials updated for: " + user.getName() + " (@" + user.getUsername() + ")", 
                "PROFILE_UPDATE"
            ));
        } catch (Exception e) {
            System.err.println("⚠️ Failed to write activity log: " + e.getMessage());
        }

        return ResponseEntity.ok("Profile updated successfully.");
    }
}

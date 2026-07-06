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

    @PutMapping("/update-username")
    public ResponseEntity<?> updateUsername(@RequestBody Map<String, String> request, Authentication authentication) {
        String newUsername = request.get("username");
        String otp = request.get("otp");

        if (newUsername == null || newUsername.trim().length() < 3) {
            return ResponseEntity.badRequest().body("Error: Username must be at least 3 characters.");
        }
        if (otp == null || otp.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: OTP is required.");
        }

        newUsername = newUsername.trim().toLowerCase();

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

        // Check uniqueness
        if (userRepository.existsByUsername(newUsername) && !user.getUsername().equals(newUsername)) {
            return ResponseEntity.badRequest().body("Error: Username is already in use!");
        }

        user.setUsername(newUsername);
        user.setOtpCode(null); // Clear OTP
        user.setOtpExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok("Username updated successfully.");
    }

    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> request, Authentication authentication) {
        String newPassword = request.get("password");
        String otp = request.get("otp");

        if (newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.badRequest().body("Error: Password must be at least 6 characters.");
        }
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

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtpCode(null); // Clear OTP
        user.setOtpExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok("Password updated successfully.");
    }
}
